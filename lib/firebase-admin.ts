// lib/firebase-admin.ts
import { getApps, initializeApp, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const app =
  getApps().length
    ? getApp()
    : initializeApp(
        projectId && clientEmail && privateKey
          ? { credential: cert({ projectId, clientEmail, privateKey }) }
          : undefined // fallback a ADC se configurato
      );

export const auth = getAuth(app);
