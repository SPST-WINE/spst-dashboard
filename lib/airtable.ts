// lib/airtable.ts
// Utilities + Airtable helpers used by API routes

export type AirtableRecord = { id: string; fields: Record<string, any> };

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

const TABLE_USERS = process.env.AIRTABLE_TABLE_USERS || 'UTENTI';
const FIELD_EMAIL = process.env.AIRTABLE_USERS_EMAIL_FIELD || 'Mail Cliente';

function baseUrl(table: string) {
  const baseId = requiredEnv('AIRTABLE_BASE_ID');
  return `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`;
}

async function atFetch(input: string, init?: RequestInit) {
  const apiKey = requiredEnv('AIRTABLE_API_KEY');
  const res = await fetch(input, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AIRTABLE_${res.status}: ${text}`);
  }
  return res.json();
}

/** Search a user by email (case-insensitive). */
export async function getUtenteByEmail(email: string): Promise<AirtableRecord | null> {
  const url = new URL(baseUrl(TABLE_USERS));
  // LOWER({Mail Cliente}) = 'email'
  url.searchParams.set('maxRecords', '1');
  url.searchParams.set('filterByFormula', `LOWER({${FIELD_EMAIL}})='${email.toLowerCase()}'`);

  const data = (await atFetch(url.toString())) as { records: AirtableRecord[] };
  return data.records?.[0] ?? null;
}

/** Alias kept for older imports (used by /api/check-user). */
export const getAirtableUserByEmail = getUtenteByEmail;

/**
 * Create or update a user row by email.
 * Always writes the email into the configured FIELD_EMAIL, plus any extra fields you pass.
 */
export async function upsertUtente(params: {
  email: string;
  fields?: Record<string, any>;
}): Promise<AirtableRecord> {
  const email = params.email.trim();
  const extra = params.fields || {};

  const existing = await getUtenteByEmail(email);

  if (existing) {
    const url = `${baseUrl(TABLE_USERS)}/${existing.id}`;
    const data = (await atFetch(url, {
      method: 'PATCH',
      body: JSON.stringify({
        fields: { [FIELD_EMAIL]: email, ...extra },
      }),
    })) as AirtableRecord;
    return data;
  }

  const data = (await atFetch(baseUrl(TABLE_USERS), {
    method: 'POST',
    body: JSON.stringify({
      records: [{ fields: { [FIELD_EMAIL]: email, ...extra } }],
      typecast: true,
    }),
  })) as { records: AirtableRecord[] };

  return data.records[0];
}
