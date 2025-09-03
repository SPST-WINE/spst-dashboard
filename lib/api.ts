export type GetIdToken =
  | (() => Promise<string | undefined> | string | undefined)
  | undefined;

async function buildAuthHeader(getIdToken?: GetIdToken) {
  if (!getIdToken) return {};
  const token =
    typeof getIdToken === 'function' ? await getIdToken() : getIdToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: res.ok, error: text || `HTTP_${res.status}` };
  }
}

async function request<T>(
  url: string,
  init: RequestInit = {},
  getIdToken?: GetIdToken
): Promise<T> {
  const auth = await buildAuthHeader(getIdToken);
  const headers = {
    ...(init.headers || {}),
    ...auth,
  } as Record<string, string>;

  const res = await fetch(url, { ...init, headers });
  const data = await parseResponse(res);

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) || `HTTP_${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

// Aggiungi la definizione del tipo qui per renderla accessibile
// a tutte le funzioni che ne hanno bisogno.
export interface SpedizioneResponse {
  ok: boolean;
  id: string;
  displayId: string;
}

export async function postSpedizione(
  payload: any,
  getIdToken?: () => Promise<string | undefined>
): Promise<{ id: string; idSped?: string }> {
  const t = (await getIdToken?.()) || undefined;
  const res = await fetch('/api/spedizioni', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j?.error || 'SERVER_ERROR');
  return { id: j.id, idSped: j.idSped };
}


/** Restituisce SEMPRE un array (normalizzato) */
export async function getSpedizioni(
  getIdToken?: GetIdToken
): Promise<any[]> {
  const json = await request<any>(
    '/api/spedizioni',
    { method: 'GET' },
    getIdToken
  );
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.results)) return json.results;
  return [];
}

export function postSpedizioneAttachments(
  id: string,
  payload: {
    fattura?: { url: string; filename?: string }[];
    packing?: { url: string; filename?: string }[];
  },
  getIdToken?: GetIdToken
): Promise<{ ok: true }> {
  return request(`/api/spedizioni/${encodeURIComponent(id)}/attachments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, getIdToken);
}

export async function postSpedizioneNotify(id: string, getToken: () => Promise<string>) {
  const token = await getToken();
  const r = await fetch(`/api/spedizioni/${id}/notify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!r.ok) throw new Error('notify failed');
  return r.json();
}
