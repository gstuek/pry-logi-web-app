# LOGISTICS 360 - Phase 5 Setup Instructions

## Invoice, Payment, and Reports Module

This document explains how to configure Firebase for Phase 5 features: Invoices, Payments, and Reports.

---

## Firebase Firestore Collections

Phase 5 adds these collections to Firestore:

### 1. invoices Collection
```
/invoices/{invoiceId}
```
Fields:
- `invoiceNumber` (string): Auto-generated invoice number (INV[YY]-[####])
- `customerId` (string): Reference to customers collection
- `customerName` (string): Denormalized customer name
- `customerAddress` (string): Denormalized customer address
- `customerPhone` (string): Denormalized customer phone
- `jobIds` (array): Array of job IDs included in this invoice
- `totalAmount` (number): Total invoice amount
- `paidAmount` (number): Amount paid so far
- `outstandingAmount` (number): Remaining amount to be paid
- `status` (string): unpaid | partial | paid
- `issuedDate` (timestamp): Date invoice was issued
- `dueDate` (timestamp): Payment due date
- `createdBy` (string): User UID who created the invoice
- `createdByName` (string): User name who created the invoice
- `createdAt` (timestamp): Creation timestamp
- `updatedAt` (timestamp): Last update timestamp

### 2. invoice_items Collection
```
/invoice_items/{itemId}
```
Fields:
- `invoiceId` (string): Reference to invoices collection
- `jobId` (string): Reference to jobs collection
- `jobNumber` (string): Denormalized job number
- `description` (string): Item description (route details)
- `pickupLocation` (string): Pickup location
- `deliveryLocation` (string): Delivery location
- `pickupDate` (timestamp): Job pickup date
- `deliveryDate` (timestamp): Job delivery date
- `amount` (number): Line item amount

### 3. payments Collection
```
/payments/{paymentId}
```
Fields:
- `invoiceId` (string): Reference to invoices collection
- `amount` (number): Payment amount
- `paymentDate` (timestamp): Date payment was made
- `paymentMethod` (string): transfer | check | cash
- `notes` (string, optional): Payment notes
- `recordedBy` (string): User UID who recorded payment
- `recordedByName` (string): User name who recorded payment
- `createdAt` (timestamp): Creation timestamp

---

## Firebase Security Rules

Add these security rules to your Firestore Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isFinance() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'finance';
    }
    
    function isAdminOrFinance() {
      return isAdmin() || isFinance();
    }
    
    // Invoices collection
    match /invoices/{invoiceId} {
      // Everyone can read invoices if authenticated
      allow read: if isAuthenticated();
      
      // Only admin and finance can create/update/delete invoices
      allow create, update, delete: if isAdminOrFinance();
    }
    
    // Invoice items collection
    match /invoice_items/{itemId} {
      // Everyone can read invoice items if authenticated
      allow read: if isAuthenticated();
      
      // Only admin and finance can create/update/delete invoice items
      allow create, update, delete: if isAdminOrFinance();
    }
    
    // Payments collection
    match /payments/{paymentId} {
      // Everyone can read payments if authenticated
      allow read: if isAuthenticated();
      
      // Only admin and finance can create/update/delete payments
      allow create, update, delete: if isAdminOrFinance();
    }
  }
}
```

---

## Google Sheets API Integration (Optional)

To enable Google Sheets export functionality, you'll need to set up Google Sheets API with a service account.

### Setup Steps:

#### 1. Create Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable Google Sheets API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

4. Create Service Account:
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in service account details
   - Click "Create and Continue"
   - Skip granting roles (optional)
   - Click "Done"

5. Create Service Account Key:
   - Click on the created service account
   - Navigate to "Keys" tab
   - Click "Add Key" > "Create New Key"
   - Select "JSON" format
   - Download the key file

#### 2. Share Google Sheet with Service Account

1. Create a new Google Sheet or use existing sheet
2. Copy the `client_email` from the downloaded JSON key file
3. Share the Google Sheet with this email address (as Editor)
4. Copy the spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```

#### 3. Configure Environment Variables

Add to your `.env` file:

```env
VITE_GOOGLE_SHEETS_ENABLED=true
VITE_GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
```

Store the service account JSON securely (DO NOT commit to repository):
- For development: Store in a secure location outside the project
- For production: Use Firebase Functions environment configuration or secret manager

#### 4. Implement Server-side Export Function

Create a Firebase Cloud Function or API endpoint to handle exports:

```typescript
// This should run server-side only (Firebase Functions)
import { google } from 'googleapis';

export const exportToSheets = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  // Load service account credentials
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  
  try {
    // Example: Write invoice data to sheet
    const { type, data: exportData } = data;
    const range = `${type}!A1`;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: exportData, // 2D array of values
      },
    });
    
    return { success: true, message: 'Export successful' };
  } catch (error) {
    console.error('Export error:', error);
    throw new functions.https.HttpsError('internal', 'Export failed');
  }
});
```

---

## Firestore Indexes (Optional)

For better query performance, create these composite indexes:

### Invoice Items by Invoice ID
- Collection: `invoice_items`
- Fields:
  - `invoiceId` (Ascending)
  - `createdAt` (Descending)

### Payments by Invoice ID
- Collection: `payments`
- Fields:
  - `invoiceId` (Ascending)
  - `createdAt` (Descending)

### Invoices by Customer
- Collection: `invoices`
- Fields:
  - `customerId` (Ascending)
  - `issuedDate` (Descending)

Create indexes via Firebase Console or using this command:
```bash
firebase firestore:indexes
```

---

## Testing Phase 5 Features

### 1. Create an Invoice

1. Navigate to `/invoices`
2. Click "สร้างใบแจ้งหนี้" (Create Invoice)
3. Select a customer
4. Select delivered jobs (status must be 'delivered')
5. Set issued date and due date
6. Click "Save"

Result:
- Invoice created in `invoices` collection
- Line items created in `invoice_items` collection
- Jobs updated to status 'invoiced'

### 2. Record a Payment

1. Click on an invoice to view details
2. Click "บันทึกการชำระเงิน" (Record Payment)
3. Enter payment amount (≤ outstanding amount)
4. Select payment method
5. Add notes (optional)
6. Click "Save"

Result:
- Payment recorded in `payments` collection
- Invoice `paidAmount` and `outstandingAmount` updated
- Invoice status updated (unpaid → partial → paid)
- If fully paid, jobs updated to 'payment-received' status

### 3. View Reports

1. Navigate to `/reports`
2. Select report type:
   - Revenue Report
   - Cost & Margin Report
   - Outstanding Report
3. Choose filters (date range, customer, vehicle, driver)
4. Click "Generate Report"
5. Export to CSV or PDF

---

## Role-Based Access Control

### Admin Role
- Full access to all invoice and payment functions
- Can create, edit, and delete invoices
- Can record and delete payments
- Can view all reports

### Finance Role
- Full access to all invoice and payment functions
- Can create, edit, and delete invoices
- Can record and delete payments
- Can view all reports

### Manager Role
- Read-only access to invoices and payments
- Can view all reports

### Ops Role
- Read-only access to invoices and payments
- Limited access to reports

### Sales Role
- Read-only access to invoices
- No access to payments
- Limited access to reports

---

## Troubleshooting

### Invoice Creation Fails
- Check that selected jobs have status 'delivered'
- Verify customer has valid payment terms
- Ensure user has admin or finance role

### Payment Record Fails
- Check that payment amount ≤ outstanding amount
- Verify invoice status is 'unpaid' or 'partial'
- Ensure user has admin or finance role

### Google Sheets Export Fails
- Verify service account has Editor access to the sheet
- Check spreadsheet ID is correct
- Ensure service account credentials are valid
- Verify Google Sheets API is enabled

---

## Next Steps

After completing Phase 5 setup:

1. Test invoice creation workflow
2. Test payment recording workflow
3. Verify job status updates correctly
4. Test all filter combinations
5. Configure Google Sheets integration (optional)
6. Train users on new features
7. Set up regular backups for financial data
8. Consider implementing PDF generation for invoices
9. Implement report generation and export features
10. Add audit logging for financial transactions
