// lib/airtable.ts
const API = 'https://api.airtable.com/v0';
const AIRTABLE_BASE = process.env.AIRTABLE_BASE_SPST!;
const HDRS = { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` };
const TBL_SPEDIZIONI = process.env.AIRTABLE_TABLE_SPEDIZIONI || 'SPEDIZIONI';
const TBL_UTENTI = process.env.AIRTABLE_TABLE_UTENTI || 'UTENTI';

// ... costanti come prima ...

export async function getUtenteByEmail(email: string) {
  const f = encodeURIComponent(`{Mail Cliente} = '${email.replace(/'/g, "\\'")}'`);
  const listUrl = `${API}/${AIRTABLE_BASE}/${encodeURIComponent(TBL_UTENTI)}?filterByFormula=${f}&maxRecords=1`;
  const listRes = await fetch(listUrl, { headers: HDRS, cache: 'no-store' });
  const list = await listRes.json();
  if (!Array.isArray(list.records) || list.records.length === 0) return null;
  return list.records[0];
}

export async function upsertUtente(email: string, payload: Record<string, any>) {
  const existing = await getUtenteByEmail(email);
  if (existing) {
    const patchRes = await fetch(`${API}/${AIRTABLE_BASE}/${encodeURIComponent(TBL_UTENTI)}`, {
      method: 'PATCH',
      headers: { ...HDRS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: [{ id: existing.id, fields: { 'Mail Cliente': email, ...payload } }],
        typecast: true,
      }),
    });
    return patchRes.json();
  }
  const postRes = await fetch(`${API}/${AIRTABLE_BASE}/${encodeURIComponent(TBL_UTENTI)}`, {
    method: 'POST',
    headers: { ...HDRS, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      records: [{ fields: { 'Mail Cliente': email, ...payload } }],
      typecast: true,
    }),
  });
  return postRes.json();
}
