// lib/firebase-admin.ts
import { getApps, initializeApp, getApp, cert, App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

let app: App;

if (getApps().length) {
  app = getApp();
} else {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = rawKey?.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;

  if (!projectId || !clientEmail || !privateKey) {
    // Fallire subito con un messaggio chiaro (su Vercel non c'è ADC)
    const missing = [
      !projectId && 'FIREBASE_PROJECT_ID',
      !clientEmail && 'FIREBASE_CLIENT_EMAIL',
      !privateKey && 'FIREBASE_PRIVATE_KEY',
    ].filter(Boolean).join(', ');
    throw new Error(`FIREBASE_ADMIN_MISCONFIG: missing envs -> ${missing}`);
  }

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

const auth = getAuth(app);

// esportiamo come funzione per avere sempre un Auth
export function adminAuth(): Auth {
  return auth;
}
export { auth };
