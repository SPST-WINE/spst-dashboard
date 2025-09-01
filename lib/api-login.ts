// lib/api-login.ts (helper lato client per creare la sessione dopo il signIn)
export async function createSessionFromIdToken(idToken: string, email?: string) {
  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, email }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `HTTP_${res.status}`);
  return json;
}
