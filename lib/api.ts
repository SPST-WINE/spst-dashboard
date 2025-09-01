// lib/api.ts
import { authClient } from '@/lib/firebase-client';
import type { NewSpedizionePayload } from '@/lib/airtable';

export async function createSpedizione(payload: NewSpedizionePayload) {
  const user = authClient().currentUser;
  if (!user) throw new Error('Not authenticated');

  const idToken = await user.getIdToken();

  const res = await fetch('/api/spedizioni', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<{ ok: true; id: string }>;
}
