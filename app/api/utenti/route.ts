// app/api/utenti/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { upsertUtente, getUtenteByEmail } from '@/lib/airtable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

// GET /api/utenti?email=...
export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get('email') ?? '').trim();
    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'EMAIL_REQUIRED' },
        { status: 400, headers: cors }
      );
    }

    const rec = await getUtenteByEmail(email);
    return NextResponse.json({ ok: true, record: rec }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}

// POST { email, fields } -> upsert utente
export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    const { email, fields } = await req.json();
    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'EMAIL_REQUIRED' },
        { status: 400, headers: cors }
      );
    }

    const record = await upsertUtente({ email, fields });
    return NextResponse.json({ ok: true, record }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}
