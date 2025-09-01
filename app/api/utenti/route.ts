// app/api/utenti/route.ts
import { NextResponse } from 'next/server';
import { getUtenteByEmail, upsertUtente } from '@/lib/airtable';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim();
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    const record = await getUtenteByEmail(email);
    return NextResponse.json({ exists: !!record, record });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email: string | undefined = body?.email?.trim();
    const fields: Record<string, any> = body?.fields || {};
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    const record = await upsertUtente({ email, fields });
    return NextResponse.json({ record });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
