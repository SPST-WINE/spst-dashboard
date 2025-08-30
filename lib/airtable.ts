const API = 'https://api.airtable.com/v0';
const base = process.env.AIRTABLE_BASE_SPST!;
const table = process.env.AIRTABLE_TABLE_SPEDIZIONI!;
const headers = { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` };

export async function listSpedizioni() {
  const url = new URL(`${API}/${base}/${encodeURIComponent(table)}`);
  const res = await fetch(url.toString(), { headers, cache: 'no-store' });
  const data = await res.json();
  return data.records as any[];
}

export async function getSpedizione(id: string) {
  const res = await fetch(`${API}/${base}/${encodeURIComponent(table)}/${id}`, { headers, cache:'no-store' });
  if (!res.ok) return null;
  return await res.json();
}
