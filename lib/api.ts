// lib/api.ts
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

export function postSpedizione(
  payload: any,
  getIdToken?: GetIdToken
): Promise<{ ok: true; id: string }> {
  return request('/api/spedizioni', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, getIdToken);
}

export function getSpedizioni(
  getIdToken?: GetIdToken
): Promise<{ ok: true; data: any[] }> {
  return request('/api/spedizioni', { method: 'GET' }, getIdToken);
}
