// lib/airtable.ts
const API = 'https://api.airtable.com/v0';

const AIRTABLE_BASE = process.env.AIRTABLE_BASE_SPST!;
const HDRS = { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` };

const TBL_SPEDIZIONI = process.env.AIRTABLE_TABLE_SPEDIZIONI || 'SPEDIZIONI';
const TBL_UTENTI = process.env.AIRTABLE_TABLE_UTENTI || 'UTENTI';

export type Spedizione = {
  id: string;
  fields: {
    ID?: string;
    Destinatario?: string;
    DataRitiro?: string;
    Stato?: string;
    LetteraDiVetturaURL?: string;
    ProformaURL?: string;
    DLEURL?: string;
  };
};

export async function listSpedizioni() {
  const url = new URL(`${API}/${AIRTABLE_BASE}/${encodeURIComponent(TBL_SPEDIZIONI)}`);
  const res = await fetch(url, { headers: HDRS, cache: 'no-store' });
  const data = await res.json();
  return data.records as Spedizione[];
}

export async function getSpedizione(id: string) {
  const res = await fetch(`${API}/${AIRTABLE_BASE}/${encodeURIComponent(TBL_SPEDIZIONI)}/${id}`, {
    headers: HDRS,
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return (await res.json()) as Spedizione;
}

/**
 * Upsert su tabella UTENTI per chiave Email.
 * Se esiste record con Email == email → PATCH; altrimenti → POST.
 */
export async function upsertUtente(email: string, payload: Record<string, any>) {
  if (!email) throw new Error('email required');

  // 1) Cerca esistenza
  const f = encodeURIComponent(`{Email} = '${email.replace(/'/g, "\\'")}'`);
  const listUrl = `${API}/${AIRTABLE_BASE}/${encodeURIComponent(TBL_UTENTI)}?filterByFormula=${f}`;
  const listRes = await fetch(listUrl, { headers: HDRS, cache: 'no-store' });
  const list = await listRes.json();

  if (Array.isArray(list.records) && list.records.length > 0) {
    // PATCH
    const id = list.records[0].id;
    const patchRes = await fetch(`${API}/${AIRTABLE_BASE}/${encodeURIComponent(TBL_UTENTI)}`, {
      method: 'PATCH',
      headers: { ...HDRS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: [{ id, fields: { Email: email, ...payload } }],
        typecast: true,
      }),
    });
    return patchRes.json();
  }

  // POST
  const postRes = await fetch(`${API}/${AIRTABLE_BASE}/${encodeURIComponent(TBL_UTENTI)}`, {
    method: 'POST',
    headers: { ...HDRS, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      records: [{ fields: { Email: email, ...payload } }],
      typecast: true,
    }),
  });
  return postRes.json();
}
