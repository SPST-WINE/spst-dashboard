import { NextResponse } from 'next/server';

const API_KEY = process.env.AIRTABLE_API_KEY!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE = process.env.AIRTABLE_UTENTI_TABLE || 'UTENTI';
// nome colonna email nella tua base (dallo screenshot): "A Mail Cliente"
const EMAIL_COL = 'A Mail Cliente';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email mancante' }, { status: 400 });
    }

    // filterByFormula con LOWER() per confronto case-insensitive
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`);
    const formula = `LOWER({${EMAIL_COL}})='${email.toLowerCase().replace(/'/g, "\\'")}'`;
    url.searchParams.set('filterByFormula', formula);
    url.searchParams.set('maxRecords', '1');

    const r = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${API_KEY}` },
      // Airtable vuole GET per query
      cache: 'no-store',
    });

    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json({ error: `Airtable error: ${text}` }, { status: 502 });
    }

    const data = await r.json();
    const exists = Array.isArray(data.records) && data.records.length > 0;

    return NextResponse.json({ exists });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Errore interno' }, { status: 500 });
  }
}
