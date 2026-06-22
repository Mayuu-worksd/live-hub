import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';

// Initialize Firebase Admin for server-side token verification
const apps = getApps();

if (!apps.length) {
  try {
    if (process.env.FIREBASE_PROJECT_ID) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Replace escaped newlines so the key works properly
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

// We use a getter function so it doesn't crash during Next.js static build
export const getAdminApp = () => {
  if (!getApps().length) return null;
  return getApp();
};

