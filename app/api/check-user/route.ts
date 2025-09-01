// app/api/check-user/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEBUG = process.env.DEBUG_CHECK_USER === 'true';

function getEnv(name: string, required = true) {
  const v = process.env[name];
  if (required && !v) throw new Error(`Missing env ${name}`);
  return v!;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'EMAIL_REQUIRED' }, { status: 400 });
    }

    const AIRTABLE_API_KEY = getEnv('AIRTABLE_API_KEY');
    const AIRTABLE_BASE_ID = getEnv('AIRTABLE_BASE_ID');
    const AIRTABLE_TABLE_USERS = getEnv('AIRTABLE_TABLE_USERS', false) || 'UTENTI';
    // ATTENZIONE: deve corrispondere esattamente al nome del campo in Airtable
    const EMAIL_FIELD = getEnv('AIRTABLE_USERS_EMAIL_FIELD', false) || 'A Mail Cliente';

    // formula case-insensitive
    const formula = `LOWER({${EMAIL_FIELD}})='${email.trim().toLowerCase()}'`;
    const url =
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_USERS)}` +
      `?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;

    const r = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      cache: 'no-store',
    });

    const text = await r.text(); // leggiamo prima il testo così possiamo loggarlo
    if (DEBUG) console.log('Airtable status:', r.status, 'body:', text);

    // NOTA: 401/403 => chiavi/scope; 404 => base o tabella inesistente
    if (!r.ok) {
      return NextResponse.json(
        { error: 'AIRTABLE_ERROR', status: r.status, detail: text },
        { status: 502 },
      );
    }

    const data = JSON.parse(text) as { records?: Array<{ id: string; fields: Record<string, any> }> };
    const rec = data.records?.[0];

    if (!rec) {
      // utente non presente/abilitato su Airtable
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    return NextResponse.json({
      exists: true,
      recordId: rec.id,
      fields: rec.fields,
    });
  } catch (e: any) {
    if (DEBUG) console.error('CHECK-USER ERROR:', e);
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: e?.message || String(e) },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
