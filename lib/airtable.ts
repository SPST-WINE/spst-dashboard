// lib/airtable.ts
type AirtableRecord = { id: string; fields: Record<string, any> };

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

/**
 * Restituisce il record UTENTI corrispondente all'email (match case-insensitive) oppure null.
 */
export async function getAirtableUserByEmail(email: string): Promise<AirtableRecord | null> {
  const apiKey = requiredEnv('AIRTABLE_API_KEY');
  const baseId = requiredEnv('AIRTABLE_BASE_ID');
  const table = process.env.AIRTABLE_TABLE_USERS || 'UTENTI';
  const emailField = process.env.AIRTABLE_USERS_EMAIL_FIELD || 'Mail Cliente';

  // formula: LOWER({Mail Cliente}) = 'email'
  const formula = `LOWER({${emailField}}) = '${email.toLowerCase()}'`;

  const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`);
  url.searchParams.set('maxRecords', '1');
  url.searchParams.set('filterByFormula', formula);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    // evita caching CDN
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AIRTABLE_HTTP_${res.status}: ${text}`);
  }

  const data = (await res.json()) as { records: AirtableRecord[] };
  return data.records?.[0] ?? null;
}
