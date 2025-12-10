# Firebase Setup Guide

This project uses Firebase Firestore as the database. Follow these steps to set up Firebase:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## 2. Enable Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Start in **production mode** (we'll set up security rules later)
4. Choose a location closest to your users

## 3. Get Service Account Key

1. Go to Project Settings (gear icon) → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Save it as `server/serviceAccountKey.json` in your project

**⚠️ Important:** Add `serviceAccountKey.json` to `.gitignore` to keep it secure!

## 4. Alternative: Use Environment Variables

Instead of using a service account file, you can use environment variables:

1. Create a `.env` file in the `server` directory (copy from `.env.example`)
2. Add your Firebase credentials:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour key here\n-----END PRIVATE KEY-----\n"
   ```

## 5. Set Up Firestore Collections

The following collections will be created automatically:
- `users` - User accounts (admin, clients)
- `projects` - Project portfolio
- `contacts` - Contact form submissions

## 6. Migrate Existing Data (Optional)

If you have existing data in JSON files, run the migration script:

```bash
cd server
node migrate-to-firebase.js
```

This will migrate:
- Users from `data/users.json`
- Projects from `data/projects.json`
- Contacts from `data/contacts.json`

## 7. Security Rules (Recommended)

Set up Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only admins can read all users
    match /users/{userId} {
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if false; // Only server can write
    }
    
    // Projects - public read, admin write
    match /projects/{projectId} {
      allow read: if true;
      allow write: if false; // Only server can write
    }
    
    // Contacts - admin only
    match /contacts/{contactId} {
      allow read, write: if false; // Only server can access
    }
  }
}
```

## 8. Test the Setup

1. Start your server: `npm run dev`
2. Check the console for "Firebase initialized" message
3. Try logging in with admin credentials:
   - Email: `admin@nexusengineering.co.tz`
   - Password: `admin123`

## Troubleshooting

### Error: "Firebase Admin SDK initialization failed"
- Make sure `serviceAccountKey.json` exists in the `server` directory
- Or set environment variables correctly
- Check that the service account has proper permissions

### Error: "Permission denied"
- Check Firestore security rules
- Ensure the service account has "Cloud Datastore User" role

### Data not appearing
- Run the migration script: `node server/migrate-to-firebase.js`
- Check Firebase Console → Firestore to see if data exists
- Check server console for errors

## Next Steps

- Set up Firebase Authentication (optional, for client-side auth)
- Configure Firebase Storage for file uploads
- Set up Firebase Hosting for deployment

