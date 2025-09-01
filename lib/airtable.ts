// lib/airtable.ts
// Client REST per Airtable (solo lato server).

export type ATRecord<T = Record<string, any>> = {
  id: string;
  createdTime?: string;
  fields: T;
};

const API_TOKEN = process.env.AIRTABLE_API_TOKEN;                // <- TUO NOME
const BASE_ID = process.env.AIRTABLE_BASE_ID_SPST;               // <- TUO NOME
const TBL_UTENTI = process.env.AIRTABLE_TABLE_UTENTI || 'UTENTI';
const EMAIL_FIELD =
  process.env.AIRTABLE_USERS_EMAIL_FIELD || 'Mail Cliente';      // <- fallback

const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG_CHECK_USER || '');

function must(name: string, v?: string) {
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

const _API_TOKEN = must('AIRTABLE_API_TOKEN', API_TOKEN);
const _BASE_ID = must('AIRTABLE_BASE_ID_SPST', BASE_ID);

async function atFetch(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.airtable.com/v0/${_BASE_ID}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${_API_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    // i route che usano questa funzione esportano runtime='nodejs'
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const errMsg = `Airtable ${res.status} ${res.statusText}: ${text || 'no body'}`;
    if (DEBUG) console.error('[Airtable]', errMsg);
    throw new Error(errMsg);
  }
  return res.json();
}

function escAirtableString(s: string) {
  return s.replace(/'/g, "\\'");
}

/** Lookup per email sul campo configurato (case-insensitive). */
export async function getAirtableUserByEmail(
  email: string
): Promise<ATRecord | null> {
  const formula = `LOWER({${EMAIL_FIELD}})='${escAirtableString(
    email.toLowerCase()
  )}'`;
  const qs = new URLSearchParams({
    filterByFormula: formula,
    maxRecords: '1',
    pageSize: '1',
  });
  const data = await atFetch(`/${encodeURIComponent(TBL_UTENTI)}?${qs}`);
  const rec: ATRecord | undefined = data?.records?.[0];
  if (DEBUG) console.log('[Airtable] getByEmail', { email, found: !!rec });
  return rec || null;
}

// alias se altrove avevi già questo nome
export const getUtenteByEmail = getAirtableUserByEmail;

/** Upsert (patch se esiste, post se non esiste). */
export async function upsertUtente(args: {
  email: string;
  fields?: Record<string, any>;
}): Promise<ATRecord> {
  const email = args.email.trim();
  const extra = args.fields || {};
  const existing = await getAirtableUserByEmail(email);

  const fields = { [EMAIL_FIELD]: email, ...extra };

  if (existing) {
    const data = await atFetch(
      `/${encodeURIComponent(TBL_UTENTI)}/${existing.id}`,
      { method: 'PATCH', body: JSON.stringify({ fields }) }
    );
    if (DEBUG) console.log('[Airtable] patched', existing.id);
    return data;
  } else {
    const data = await atFetch(`/${encodeURIComponent(TBL_UTENTI)}`, {
      method: 'POST',
      body: JSON.stringify({ fields }),
    });
    if (DEBUG) console.log('[Airtable] created', data?.id);
    return data;
  }
}
