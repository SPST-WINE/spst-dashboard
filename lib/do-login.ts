// lib/do-login.ts
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';

export async function doLogin(email: string, password: string) {
  const auth = getAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await cred.user.getIdToken(true);

  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, email }),
  });

  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || 'LOGIN_FAIL');
  }

  return (await res.json()) as { ok: true; email: string | null };
}
