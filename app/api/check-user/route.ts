// app/api/check-user/route.ts
import { NextResponse } from 'next/server';
import { getAirtableUserByEmail } from '@/lib/airtable';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    const record = await getAirtableUserByEmail(email.trim());
    if (!record) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

    return NextResponse.json({ ok: true, id: record.id, fields: record.fields });
  } catch (e: any) {
    // ritorno il dettaglio per capire subito cosa non va (env/table/field…)
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: e?.message || 'unknown' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim();
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    const record = await getAirtableUserByEmail(email);
    if (!record) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

    return NextResponse.json({ ok: true, id: record.id, fields: record.fields });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: e?.message || 'unknown' },
      { status: 500 }
    );
  }
}
