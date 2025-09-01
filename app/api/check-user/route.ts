// app/api/check-user/route.ts
import { NextResponse } from 'next/server';
import { getAirtableUserByEmail } from '@/lib/airtable';
import { buildCorsHeaders } from '@/lib/cors';

export const runtime = 'nodejs';

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) });
}

export async function POST(req: Request) {
  const cors = buildCorsHeaders(req);
  try {
    const { email } = await req.json();
    if (!email)
      return NextResponse.json({ error: 'email required' }, { status: 400, headers: cors });

    const rec = await getAirtableUserByEmail(email);
    if (!rec)
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: cors });

    return NextResponse.json({ ok: true, id: rec.id, fields: rec.fields }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: e?.message || 'unknown' },
      { status: 500, headers: cors }
    );
  }
}

export async function GET(req: Request) {
  const cors = buildCorsHeaders(req);
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim();
    if (!email)
      return NextResponse.json({ error: 'email required' }, { status: 400, headers: cors });

    const rec = await getAirtableUserByEmail(email);
    if (!rec)
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: cors });

    return NextResponse.json({ ok: true, id: rec.id, fields: rec.fields }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: e?.message || 'unknown' },
      { status: 500, headers: cors }
    );
  }
}
