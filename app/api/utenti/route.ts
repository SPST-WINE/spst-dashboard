// app/api/utenti/route.ts
import { NextResponse } from 'next/server';
import { upsertUtente, getUtenteByEmail } from '@/lib/airtable';

export const runtime = 'nodejs';

// GET /api/utenti?email=foo@bar.com
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  try {
    const record = await getUtenteByEmail(email);
    return NextResponse.json(record || null);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 });
  }
}

// POST /api/utenti  body: { email, ...fields }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, ...fields } = body || {};
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    const result = await upsertUtente(email, fields);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 });
  }
}
