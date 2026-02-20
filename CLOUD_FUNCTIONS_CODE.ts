/**
 * Firebase Cloud Functions for PRY Logi Phase 4: Tracking & Photo Upload
 * 
 * This file contains all Cloud Functions needed for automatic photo deletion
 * and storage cleanup.
 * 
 * Setup Instructions:
 * 1. Initialize Firebase Functions: firebase init functions
 * 2. Copy this code to functions/src/index.ts
 * 3. Install dependencies: cd functions && npm install
 * 4. Deploy: firebase deploy --only functions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

/**
 * Cloud Function: onJobPhotoExpiry
 * 
 * Triggered when a photo document is deleted from Firestore (via TTL).
 * This automatically deletes the corresponding file from Firebase Storage.
 * 
 * Trigger: Firestore document delete on photos/{photoId}
 * Purpose: Clean up storage files when photo metadata expires
 * 
 * Flow:
 * 1. Photo document reaches deleteAt timestamp
 * 2. Firestore TTL automatically deletes the document
 * 3. This function is triggered
 * 4. Function reads storagePath from deleted document
 * 5. Function deletes file from Storage
 * 6. Function logs the deletion to deletion_logs collection
 */
export const onJobPhotoExpiry = functions.firestore
  .document('photos/{photoId}')
  .onDelete(async (snapshot, context) => {
    const photoData = snapshot.data();
    const photoId = context.params.photoId;

    try {
      console.log(`[onJobPhotoExpiry] Photo TTL expired for photoId: ${photoId}`);

      const storagePath = photoData.storagePath;
      const jobId = photoData.jobId;

      if (!storagePath) {
        console.error(`[onJobPhotoExpiry] No storagePath found for photoId: ${photoId}`);
        return null;
      }

      const bucket = storage.bucket();
      const file = bucket.file(storagePath);
      
      const [exists] = await file.exists();
      
      if (exists) {
        await file.delete();
        console.log(`[onJobPhotoExpiry] Successfully deleted file from storage: ${storagePath}`);
      } else {
        console.warn(`[onJobPhotoExpiry] File not found in storage: ${storagePath}`);
      }

      await db.collection('deletion_logs').add({
        photoId,
        jobId,
        storagePath,
        fileName: photoData.fileName || 'unknown',
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        reason: 'auto-expiry',
        success: true,
        originalUploadedBy: photoData.uploadedBy || null,
        originalUploadedAt: photoData.uploadedAt || null,
      });

      console.log(`[onJobPhotoExpiry] Deletion logged for photoId: ${photoId}`);
      return null;
      
    } catch (error) {
      console.error(`[onJobPhotoExpiry] Error deleting photo ${photoId}:`, error);

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
 * Cloud Function: cleanupOrphanedFiles
 * 
 * Scheduled function that runs daily to clean up orphaned storage files.
 * An orphaned file is a file in Storage that has no corresponding document
 * in the photos collection.
 * 
 * Schedule: Daily at 2:00 AM Bangkok time
 * Purpose: Prevent storage bloat from failed deletions or edge cases
 * 
 * Flow:
 * 1. List all files in jobs/ prefix
 * 2. For each file, check if photos collection has a reference
 * 3. If no reference exists, file is orphaned
 * 4. Delete orphaned file
 * 5. Log deletion to deletion_logs
 */
export const cleanupOrphanedFiles = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    console.log('[cleanupOrphanedFiles] Starting cleanup of orphaned files...');

    try {
      const bucket = storage.bucket();
      const [files] = await bucket.getFiles({ prefix: 'jobs/' });

      let orphanedCount = 0;
      let checkedCount = 0;

      for (const file of files) {
        const filePath = file.name;
        checkedCount++;
        
        const photosQuery = await db.collection('photos')
          .where('storagePath', '==', filePath)
          .limit(1)
          .get();

        if (photosQuery.empty) {
          console.log(`[cleanupOrphanedFiles] Orphaned file found: ${filePath}`);
          
          try {
            await file.delete();
            orphanedCount++;

            await db.collection('deletion_logs').add({
              storagePath: filePath,
              deletedAt: admin.firestore.FieldValue.serverTimestamp(),
              reason: 'orphaned-cleanup',
              success: true,
            });
          } catch (deleteError) {
            console.error(`[cleanupOrphanedFiles] Failed to delete ${filePath}:`, deleteError);
            
            await db.collection('deletion_logs').add({
              storagePath: filePath,
              deletedAt: admin.firestore.FieldValue.serverTimestamp(),
              reason: 'orphaned-cleanup',
              success: false,
              error: deleteError instanceof Error ? deleteError.message : 'Unknown error',
            });
          }
        }
      }

      console.log(`[cleanupOrphanedFiles] Cleanup completed. Checked ${checkedCount} files, deleted ${orphanedCount} orphaned files.`);
      
      await db.collection('cleanup_reports').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        filesChecked: checkedCount,
        filesDeleted: orphanedCount,
        success: true,
      });

      return null;
      
    } catch (error) {
      console.error('[cleanupOrphanedFiles] Error during cleanup:', error);
      
      await db.collection('cleanup_reports').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  });

/**
 * Optional: Manual trigger for testing
 * 
 * Call this function from Firebase Console or CLI to manually test
 * the photo deletion flow.
 * 
 * Usage:
 * firebase functions:shell
 * > testPhotoCleanup({photoId: 'YOUR_PHOTO_ID'})
 */
export const testPhotoCleanup = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const photoId = data.photoId;
  
  if (!photoId) {
    throw new functions.https.HttpsError('invalid-argument', 'photoId is required');
  }

  try {
    const photoDoc = await db.collection('photos').doc(photoId).get();
    
    if (!photoDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Photo document not found');
    }

    const photoData = photoDoc.data();
    const storagePath = photoData?.storagePath;

    if (!storagePath) {
      throw new functions.https.HttpsError('invalid-argument', 'Photo has no storagePath');
    }

    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    const [exists] = await file.exists();

    if (!exists) {
      return { success: false, message: 'File does not exist in storage' };
    }

    await file.delete();
    await photoDoc.ref.delete();

    await db.collection('deletion_logs').add({
      photoId,
      jobId: photoData?.jobId || null,
      storagePath,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      reason: 'manual-test',
      success: true,
      deletedBy: context.auth.uid,
    });

    return { 
      success: true, 
      message: `Successfully deleted photo ${photoId} and file ${storagePath}` 
    };
    
  } catch (error) {
    console.error('[testPhotoCleanup] Error:', error);
    throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Unknown error');
  }
});

/**
 * Optional: Get deletion statistics
 * 
 * Returns statistics about photo deletions for monitoring.
 * Only accessible by admin users.
 */
export const getDeletionStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userRole = userDoc.data()?.role;

  if (userRole !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can access deletion stats');
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletionLogsSnapshot = await db.collection('deletion_logs')
      .where('deletedAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .get();

    const stats = {
      totalDeletions: 0,
      autoExpiry: 0,
      manualDelete: 0,
      orphanedCleanup: 0,
      failures: 0,
    };

    deletionLogsSnapshot.forEach(doc => {
      const data = doc.data();
      stats.totalDeletions++;

      if (!data.success) {
        stats.failures++;
      }

      switch (data.reason) {
        case 'auto-expiry':
          stats.autoExpiry++;
          break;
        case 'manual-delete':
          stats.manualDelete++;
          break;
        case 'orphaned-cleanup':
          stats.orphanedCleanup++;
          break;
      }
    });

    return stats;
    
  } catch (error) {
    console.error('[getDeletionStats] Error:', error);
    throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Unknown error');
  }
});
