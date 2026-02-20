# Firebase Setup Instructions for Phase 4: Tracking & Photo Upload

## 1. Firestore TTL (Time-To-Live) Setup

Firestore has a built-in TTL feature that automatically deletes documents when a specified timestamp field is reached.

### Enable Firestore TTL:

1. Go to Firebase Console → Firestore Database
2. Click on the "Indexes" tab
3. Create a TTL policy:
   - Collection: `photos`
   - Field: `deleteAt`
   - Type: TTL (Time-to-Live)

Alternatively, use the Firebase CLI:

```bash
firebase firestore:ttl:enable photos deleteAt
```

This will automatically delete documents in the `photos` collection when the `deleteAt` timestamp is reached.

## 2. Firebase Storage Security Rules

Update your Firebase Storage security rules to control access to uploaded photos:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read all job photos
    match /jobs/{jobId}/{allPaths=**} {
      allow read: if request.auth != null;
    }
    
    // Allow ops, admin, and manager to upload workflow photos
    match /jobs/{jobId}/workflow/{stepNumber}/{fileName} {
      allow write: if request.auth != null 
        && (
          get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'ops'
          || get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin'
          || get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'manager'
        )
        && request.resource.size <= 5 * 1024 * 1024; // Max 5MB
    }
    
    // Allow ops, admin, and manager to upload document photos
    match /jobs/{jobId}/documents/{fileName} {
      allow write: if request.auth != null 
        && (
          get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'ops'
          || get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin'
          || get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'manager'
        )
        && request.resource.size <= 5 * 1024 * 1024; // Max 5MB
    }
    
    // Allow ops, admin, and manager to delete their own uploaded photos
    match /jobs/{jobId}/{allPaths=**} {
      allow delete: if request.auth != null 
        && (
          get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'ops'
          || get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin'
          || get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'manager'
        );
    }
  }
}
```

Deploy the rules:
```bash
firebase deploy --only storage
```

## 3. Firestore Security Rules

Add these rules to your Firestore security rules for the new collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check user role
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    function isOpsOrAdmin() {
      let role = getUserRole();
      return role == 'ops' || role == 'admin' || role == 'manager';
    }
    
    // Photos collection - read by all authenticated, write by ops/admin/manager
    match /photos/{photoId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isOpsOrAdmin();
      allow update, delete: if isAuthenticated() && isOpsOrAdmin();
    }
    
    // Tracking events subcollection
    match /jobs/{jobId}/tracking_events/{eventId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isOpsOrAdmin();
      allow update, delete: if isAuthenticated() && isOpsOrAdmin();
    }
    
    // Deletion logs - only system can write
    match /deletion_logs/{logId} {
      allow read: if isAuthenticated() && getUserRole() == 'admin';
      allow write: if isAuthenticated() && isOpsOrAdmin();
    }
    
    // Update existing jobs rule to allow currentTrackingStep and paymentReceivedDate
    match /jobs/{jobId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated() && isOpsOrAdmin();
      allow delete: if isAuthenticated() && getUserRole() == 'admin';
    }
  }
}
```

Deploy the rules:
```bash
firebase deploy --only firestore:rules
```

## 4. Cloud Functions Setup

### Install Firebase Functions

If you haven't already set up Cloud Functions:

```bash
firebase init functions
```

Select TypeScript and install dependencies.

### Create the Cloud Function

Create or update `functions/src/index.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

/**
 * Cloud Function: onJobPhotoExpiry
 * Triggered when a photo document is deleted from Firestore (via TTL)
 * Deletes the corresponding file from Firebase Storage
 */
export const onJobPhotoExpiry = functions.firestore
  .document('photos/{photoId}')
  .onDelete(async (snapshot, context) => {
    const photoData = snapshot.data();
    const photoId = context.params.photoId;

    try {
      console.log(`Photo TTL expired for photoId: ${photoId}`);

      // Get the storage path from the deleted document
      const storagePath = photoData.storagePath;
      const jobId = photoData.jobId;

      if (!storagePath) {
        console.error(`No storagePath found for photoId: ${photoId}`);
        return null;
      }

      // Delete the file from Firebase Storage
      const bucket = storage.bucket();
      const file = bucket.file(storagePath);
      
      const [exists] = await file.exists();
      if (exists) {
        await file.delete();
        console.log(`Successfully deleted file from storage: ${storagePath}`);
      } else {
        console.warn(`File not found in storage: ${storagePath}`);
      }

      // Log the deletion
      await db.collection('deletion_logs').add({
        photoId,
        jobId,
        storagePath,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        reason: 'auto-expiry',
        success: true,
      });

      console.log(`Deletion logged for photoId: ${photoId}`);
      return null;
    } catch (error) {
      console.error(`Error deleting photo ${photoId}:`, error);

      // Log the failed deletion
      await db.collection('deletion_logs').add({
        photoId,
        jobId: photoData.jobId,
        storagePath: photoData.storagePath,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        reason: 'auto-expiry',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  });

/**
 * Scheduled function to check and clean up orphaned storage files
 * Runs daily at 2 AM
 */
export const cleanupOrphanedFiles = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    console.log('Starting cleanup of orphaned files...');

    try {
      const bucket = storage.bucket();
      const [files] = await bucket.getFiles({ prefix: 'jobs/' });

      let orphanedCount = 0;

      for (const file of files) {
        const filePath = file.name;
        
        // Query Firestore to check if this file still has a reference
        const photosQuery = await db.collection('photos')
          .where('storagePath', '==', filePath)
          .limit(1)
          .get();

        // If no reference found, file is orphaned
        if (photosQuery.empty) {
          console.log(`Orphaned file found: ${filePath}`);
          
          await file.delete();
          orphanedCount++;

          // Log the cleanup
          await db.collection('deletion_logs').add({
            storagePath: filePath,
            deletedAt: admin.firestore.FieldValue.serverTimestamp(),
            reason: 'orphaned-cleanup',
            success: true,
          });
        }
      }

      console.log(`Cleanup completed. Deleted ${orphanedCount} orphaned files.`);
      return null;
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  });
```

### Deploy the Cloud Functions

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

## 5. Firestore Indexes

You may need to create composite indexes for efficient queries. Create `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "photos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "jobId", "order": "ASCENDING" },
        { "fieldPath": "folder", "order": "ASCENDING" },
        { "fieldPath": "uploadedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "photos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "jobId", "order": "ASCENDING" },
        { "fieldPath": "stepNumber", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tracking_events",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "jobId", "order": "ASCENDING" },
        { "fieldPath": "stepNumber", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

## 6. Testing the Setup

### Test Photo Upload:
1. Create a job in the system
2. Navigate to Tracking → Select the job
3. Update status to any step
4. Upload photos (max 5, max 5MB each)
5. Verify files appear in Firebase Storage under `jobs/{jobId}/workflow/{stepNumber}/`
6. Verify photo metadata is saved in Firestore `photos` collection

### Test Auto-Delete Trigger:
1. Update a job status to "Payment Received" (step 9)
2. Check that all workflow photos for that job have `deleteAt` set to +30 days
3. Check that all document photos for that job have `deleteAt` set to +90 days
4. Verify `paymentReceivedDate` is saved on the job document

### Test Manual Delete:
1. Click delete on any photo
2. Verify file is removed from Storage
3. Verify document is updated in Firestore with current `deleteAt`
4. Verify entry is created in `deletion_logs` collection

### Test TTL Expiry (Manual):
For testing, you can manually set `deleteAt` to a past date:
```javascript
// In Firebase Console Firestore:
// Update a photo document's deleteAt field to yesterday's date
// Wait for TTL process to run (may take up to 24 hours in production)
// Or trigger the Cloud Function manually for testing
```

## 7. Monitoring

Monitor your Cloud Functions in the Firebase Console:
- Go to Functions → Dashboard
- Check function execution logs
- Monitor errors and performance
- Set up alerts for failures

Check deletion logs:
```javascript
// Query deletion logs
db.collection('deletion_logs')
  .orderBy('deletedAt', 'desc')
  .limit(100)
  .get()
```

## 8. Cost Considerations

- **Storage**: Photos are stored in Firebase Storage (~$0.026/GB/month)
- **Firestore**: Photo metadata documents (~$0.18 per 100k document reads)
- **Functions**: onJobPhotoExpiry triggers on each photo deletion (~$0.40 per million invocations)
- **TTL**: Firestore TTL is free, runs automatically

Expected costs for 1000 jobs/month with avg 10 photos each:
- Storage: ~$0.50/month (assuming 2MB per photo)
- Firestore: ~$0.02/month
- Functions: ~$0.01/month
- **Total: ~$0.53/month**

## 9. Backup Strategy

Consider implementing regular backups:
```bash
gcloud firestore export gs://[BUCKET_NAME]/firestore-backups
```

Or use Firebase's scheduled exports feature.

## 10. Troubleshooting

**TTL not deleting documents:**
- Verify TTL is enabled on the `deleteAt` field
- Check that `deleteAt` is a Timestamp type
- TTL runs within 24 hours of expiration

**Cloud Function not triggering:**
- Check function deployment status
- Verify IAM permissions
- Check function logs for errors

**Storage files not deleting:**
- Verify Storage security rules
- Check that storagePath in Firestore matches actual file path
- Verify service account has Storage Admin role
