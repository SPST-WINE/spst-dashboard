// app/api/utenti/route.ts
import { NextResponse } from 'next/server';
import { getUtenteByEmail, upsertUtente } from '@/lib/airtable';
import { buildCorsHeaders } from '@/lib/cors';

export const runtime = 'nodejs';

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) });
}

export async function GET(req: Request) {
  const cors = buildCorsHeaders(req);
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim();
    if (!email)
      return NextResponse.json({ error: 'email required' }, { status: 400, headers: cors });

    const record = await getUtenteByEmail(email);
    return NextResponse.json({ exists: !!record, record }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'SERVER_ERROR' }, { status: 500, headers: cors });
  }
}

export async function POST(req: Request) {
  const cors = buildCorsHeaders(req);
  try {
    const body = await req.json().catch(() => ({}));
    const email: string | undefined = body?.email?.trim();
    const fields: Record<string, any> = body?.fields || {};
    if (!email)
      return NextResponse.json({ error: 'email required' }, { status: 400, headers: cors });

    const record = await upsertUtente({ email, fields });
    return NextResponse.json({ record }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'SERVER_ERROR' }, { status: 500, headers: cors });
  }
}
