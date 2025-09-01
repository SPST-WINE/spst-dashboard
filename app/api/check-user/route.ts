// app/api/check-user/route.ts
import { NextResponse } from 'next/server';
import { getAirtableUserByEmail } from '@/lib/airtable';

export const runtime = 'nodejs';

// Convenience GET: /api/check-user?email=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim();
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    const user = await getAirtableUserByEmail(email);
    if (!user) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

    return NextResponse.json({ ok: true, id: user.id, fields: user.fields });
  } catch (e: any) {
    return NextResponse.json({ error: 'SERVER_ERROR', detail: e?.message }, { status: 500 });
  }
}

// Primary POST used by the login form: { email }
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    const user = await getAirtableUserByEmail(email.trim());
    if (!user) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

    return NextResponse.json({ ok: true, id: user.id, fields: user.fields });
  } catch (e: any) {
    return NextResponse.json({ error: 'SERVER_ERROR', detail: e?.message }, { status: 500 });
  }
}
