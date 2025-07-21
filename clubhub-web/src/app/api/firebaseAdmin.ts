import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

if (!getApps().length) {
  const privateKey = process.env.ADMIN_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!process.env.ADMIN_FIREBASE_PROJECT_ID || !process.env.ADMIN_FIREBASE_CLIENT_EMAIL || !privateKey) {
    throw new Error('Firebase Admin SDK environment variables are not set.');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.ADMIN_FIREBASE_PROJECT_ID,
      clientEmail: process.env.ADMIN_FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.ADMIN_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const auth = admin.auth();
const firestore = admin.firestore();

export { auth, firestore, admin };