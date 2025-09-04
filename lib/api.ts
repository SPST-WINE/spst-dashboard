// lib/api.ts

// Permette di passare direttamente un token o una funzione che lo ritorna
export type GetIdToken =
  | (() => Promise<string | undefined> | string | undefined)
  | undefined;

export class ApiError extends Error {
  code?: string;
  status?: number;
  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

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
    // Prova a restituire qualcosa di sensato anche se non è JSON
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
  const data: any = await parseResponse(res);

  // Considera errore sia HTTP !ok che payload { ok:false }
  if (!res.ok || (data && typeof data === 'object' && 'ok' in data && data.ok === false)) {
    const code = data?.error as string | undefined;
    const msg =
      (data?.message as string | undefined) ||
      (data?.error as string | undefined) ||
      `HTTP_${res.status}`;
    throw new ApiError(msg, code, res.status);
  }

  return data as T;
}

// ---------- Tipi di comodo ----------
export interface SpedizioneResponse {
  ok: boolean;
  id: string;
  displayId: string;
}

// ---------- API: Spedizioni ----------
export async function postSpedizione(
  payload: any,
  getIdToken?: GetIdToken
): Promise<{ id: string; idSped?: string; idSpedizione?: string }> {
  const data = await request<{
    ok: true;
    id: string;
    idSped?: string;
    idSpedizione?: string;
  }>(
    '/api/spedizioni',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    },
    getIdToken
  );

  // compat: mappa idSpedizione -> idSped se necessario
  return {
    id: (data as any).id,
    idSped: (data as any).idSped ?? (data as any).idSpedizione,
    idSpedizione: (data as any).idSpedizione,
  };
}

/** Restituisce SEMPRE un array normalizzato (usa { ok, rows } della route) */
export async function getSpedizioni(
  getIdToken?: GetIdToken,
  params?: { q?: string; sort?: 'created_desc' | 'ritiro_desc' | 'dest_az' | 'status' }
): Promise<any[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.sort) qs.set('sort', params.sort);

  const data = await request<{ ok: boolean; rows: any[] }>(
    `/api/spedizioni${qs.toString() ? `?${qs}` : ''}`,
    { method: 'GET' },
    getIdToken
  );
  return Array.isArray(data?.rows) ? data.rows : [];
}

export function postSpedizioneAttachments(
  id: string,
  payload: {
    fattura?: { url: string; filename?: string }[];
    packing?: { url: string; filename?: string }[];
  },
  getIdToken?: GetIdToken
): Promise<{ ok: true }> {
  return request(
    `/api/spedizioni/${encodeURIComponent(id)}/attachments`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    },
    getIdToken
  );
}

export async function postSpedizioneNotify(
  id: string,
  getIdToken?: GetIdToken
): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(
    `/api/spedizioni/${encodeURIComponent(id)}/notify`,
    { method: 'POST' },
    getIdToken
  );
}

// ---------- API: Profilo / UTENTI ----------
export async function getUserProfile(
  getIdToken?: GetIdToken
): Promise<{ ok: boolean; email?: string; party?: any }> {
  return request('/api/profile', { method: 'GET', credentials: 'include' }, getIdToken);
}

export async function saveUserProfile(
  party: any,
  getIdToken?: GetIdToken
): Promise<{ ok: boolean; id?: string }> {
  return request(
    '/api/profile',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ party }),
    },
    getIdToken
  );
}

/*
Uso (esempio gestione errori lato UI):

try {
  await postSpedizione(payload, getIdToken);
} catch (e) {
  const err = e as ApiError;
  if (err.code === 'DEST_PIVA_REQUIRED') {
    // mostra messaggio specifico e focus sul campo
  } else {
    // fallback: err.message
  }
}
*/
