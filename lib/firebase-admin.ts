// lib/firebase-admin.ts
import { getApps, initializeApp, getApp, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawKey = process.env.FIREBASE_PRIVATE_KEY;
const privateKey = rawKey ? rawKey.replace(/\\n/g, '\n') : undefined;

let app: App;

if (!getApps().length) {
  // Usa Service Account dalle env se completo, altrimenti Application Default Credentials
  const credential =
    projectId && clientEmail && privateKey
      ? cert({ projectId, clientEmail, privateKey })
      : applicationDefault();

  app = initializeApp({ credential });
} else {
  app = getApp();
}

const _auth = getAuth(app);

/** ✅ Da usare ovunque: adminAuth().verifyIdToken(...), adminAuth().getUser(...), ecc. */
export function adminAuth(): Auth {
  return _auth;
}

/** Export opzionale se ti serve direttamente l’oggetto */
export { _auth as auth };

/** Helper comodo */
export function verifyIdToken(idToken: string) {
  return _auth.verifyIdToken(idToken);
}
