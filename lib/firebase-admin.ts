// lib/firebase-admin.ts
import { getApps, initializeApp, getApp, cert, App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

function getEnv(name: string) {
  return process.env[name];
}

const projectId =
  getEnv('FIREBASE_PROJECT_ID') || getEnv('FIREBASE_ADMIN_PROJECT_ID');

const clientEmail =
  getEnv('FIREBASE_CLIENT_EMAIL') || getEnv('FIREBASE_ADMIN_CLIENT_EMAIL');

const rawKey =
  getEnv('FIREBASE_PRIVATE_KEY') || getEnv('FIREBASE_ADMIN_PRIVATE_KEY');

const privateKey = rawKey?.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;

let app: App;
if (getApps().length) {
  app = getApp();
} else {
  if (!projectId || !clientEmail || !privateKey) {
    const missing = [
      !projectId && 'FIREBASE_PROJECT_ID|FIREBASE_ADMIN_PROJECT_ID',
      !clientEmail && 'FIREBASE_CLIENT_EMAIL|FIREBASE_ADMIN_CLIENT_EMAIL',
      !privateKey && 'FIREBASE_PRIVATE_KEY|FIREBASE_ADMIN_PRIVATE_KEY',
    ]
      .filter(Boolean)
      .join(', ');
    throw new Error(`FIREBASE_ADMIN_MISCONFIG: missing envs -> ${missing}`);
  }

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

const _auth = getAuth(app);
export function adminAuth(): Auth {
  return _auth;
}
export { _auth as auth };
