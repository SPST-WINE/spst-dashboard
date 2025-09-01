// app/api/check-user/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function required(name: string, val?: string) {
  if (!val) throw new Error(`Missing env ${name}`);
  return val;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'EMAIL_REQUIRED' }, { status: 400 });
    }

    const AIRTABLE_API_KEY = required('AIRTABLE_API_KEY', process.env.AIRTABLE_API_KEY);
    const AIRTABLE_BASE_ID = required('AIRTABLE_BASE_ID', process.env.AIRTABLE_BASE_ID);
    const AIRTABLE_TABLE_USERS = process.env.AIRTABLE_TABLE_USERS || 'UTENTI';
    // Nome del campo email su Airtable (es. "A Mail Cliente" oppure "Mail Cliente")
    const EMAIL_FIELD = process.env.AIRTABLE_USERS_EMAIL_FIELD || 'Mail Cliente';

    // Formula case-insensitive
    const formula = `LOWER({${EMAIL_FIELD}})='${email.trim().toLowerCase()}'`;
    const url =
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_USERS)}` +
      `?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;

    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
      // Airtable REST richiede GET per filterByFormula
      cache: 'no-store',
    });

    // 404 su Airtable = base o tabella errata (NOT_FOUND)
    if (r.status === 404) {
      const body = await r.text();
      return NextResponse.json(
        { error: 'AIRTABLE_NOT_FOUND', detail: body },
        { status: 502 },
      );
    }

    if (!r.ok) {
      const err = await r.text();
      return NextResponse.json(
        { error: 'AIRTABLE_ERROR', detail: err },
        { status: 502 },
      );
    }

    const data = (await r.json()) as { records?: Array<{ id: string; fields: Record<string, any> }> };
    const rec = data.records?.[0];

    if (!rec) {
      // Utente non abilitato in Airtable
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    // Facoltativo: puoi esporre qualche field utile (ruolo, attivo, ecc.)
    return NextResponse.json({
      exists: true,
      recordId: rec.id,
      fields: rec.fields,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: e?.message || String(e) },
      { status: 500 },
    );
  }
}

// Opzionale: ping per debug
export async function GET() {
  return NextResponse.json({ ok: true });
}
