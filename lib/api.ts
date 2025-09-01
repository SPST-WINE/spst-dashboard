// lib/api.ts (client helper: chiamata dal pulsante "Salva")
export async function postSpedizione(payload: any, getIdToken?: () => Promise<string | undefined>) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (getIdToken) {
    const token = await getIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch('/api/spedizioni', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP_${res.status}`);
  }
  return res.json();
}
