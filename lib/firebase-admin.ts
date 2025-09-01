// lib/firebase-admin.ts
// Complete module: exports getAdminAuth + alias adminAuth (compat)

import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

let _auth: Auth | null = null;

export function getAdminAuth(): Auth {
  if (_auth) return _auth;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (privateKey && privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!getApps().length) {
    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      initializeApp({ credential: applicationDefault() });
    }
  }

  _auth = getAuth();
  return _auth!;
}

// Alias per compatibilità con import esistenti
export const adminAuth = getAdminAuth;
