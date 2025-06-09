import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

const serviceAccount = require('../../../firebasekey.json');

if (!getApps().length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const auth = admin.auth();
const firestore = admin.firestore();

export { auth, firestore, admin };