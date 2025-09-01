// lib/airtable.ts
// Client minimale via REST (no SDK). Funziona solo lato server.

export type ATRecord<T = Record<string, any>> = {
  id: string;
  createdTime?: string;
  fields: T;
};

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TBL_UTENTI = process.env.AIRTABLE_UTENTI_TABLE || 'UTENTI';
const EMAIL_FIELD = 'Mail Cliente'; // nome colonna in Airtable

function must(name: string, v?: string) {
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

const _API_KEY = must('AIRTABLE_API_KEY', API_KEY);
const _BASE_ID = must('AIRTABLE_BASE_ID', BASE_ID);

async function atFetch(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.airtable.com/v0/${_BASE_ID}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${_API_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    // IMPORTANT: Next su Vercel deve essere in runtime nodejs (non edge)
    // il route handler che usa queste funzioni ha `export const runtime = 'nodejs'`
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(
      `Airtable ${res.status} ${res.statusText}: ${text || 'no body'}`
    );
    // rethrow con messaggio utile al client
    throw err;
  }
  return res.json();
}

function escAirtableString(s: string) {
  // Escapo gli apici singoli per filterByFormula
  return s.replace(/'/g, "\\'");
}

/** Cerca 1 utente per email sul campo "Mail Cliente" (case-insensitive). */
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
  return rec || null;
}

// Alias se altrove avevi già questo nome
export const getUtenteByEmail = getAirtableUserByEmail;

/** Crea o aggiorna l’utente in base all’email. */
export async function upsertUtente(args: {
  email: string;
  fields?: Record<string, any>;
}): Promise<ATRecord> {
  const email = args.email.trim();
  const extra = args.fields || {};

  const existing = await getAirtableUserByEmail(email);
  // payload campi: imposto sempre l'email nel campo corretto
  const fields = { [EMAIL_FIELD]: email, ...extra };

  if (existing) {
    const data = await atFetch(
      `/${encodeURIComponent(TBL_UTENTI)}/${existing.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ fields }),
      }
    );
    return data;
  } else {
    const data = await atFetch(`/${encodeURIComponent(TBL_UTENTI)}`, {
      method: 'POST',
      body: JSON.stringify({ fields }),
    });
    return data;
  }
}
