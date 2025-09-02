// app/api/utenti/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function readOrigin(req: NextRequest) {
  return req.headers.get('origin') ?? undefined;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(readOrigin(req)),
  });
}

// GET /api/utenti?email=...
export async function GET(req: NextRequest) {
  const origin = readOrigin(req);
  const cors = buildCorsHeaders(origin);

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || undefined;

    const airtable: any = await import('@/lib/airtable').catch(() => ({}));
    const fn = airtable?.getUtenteByEmail;

    if (email && typeof fn === 'function') {
      const rec = await fn(email);
      return NextResponse.json({ ok: true, data: rec ? [rec] : [] }, { headers: cors });
    }

    // fallback: niente funzione => lista vuota
    return NextResponse.json({ ok: true, data: [] }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors },
    );
  }
}

// POST /api/utenti  body: { email, fields }
export async function POST(req: NextRequest) {
  const origin = readOrigin(req);
  const cors = buildCorsHeaders(origin);

  try {
    const body = await req.json().catch(() => ({}));
    const email: string | undefined = body?.email;
    const fields: Record<string, any> = body?.fields || {};

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'EMAIL_REQUIRED' },
        { status: 400, headers: cors },
      );
    }

    const airtable: any = await import('@/lib/airtable').catch(() => ({}));
    const fn = airtable?.upsertUtente;

    if (typeof fn === 'function') {
      const record = await fn(email, fields);
      return NextResponse.json({ ok: true, record }, { headers: cors });
    }

    // fallback: nessuna funzione implementata
    return NextResponse.json(
      { ok: true, record: null, note: 'upsertUtente non implementato' },
      { headers: cors },
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors },
    );
  }
}
