import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase configuration with fallbacks for build time
export const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'build_placeholder',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'build_placeholder',
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'build_placeholder',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'build_placeholder',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'build_placeholder',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'build_placeholder',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'build_placeholder',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;