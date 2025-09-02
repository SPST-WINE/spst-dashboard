// app/api/check-user/route.ts
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

// GET /api/check-user?email=...
export async function GET(req: NextRequest) {
  const origin = readOrigin(req);
  const cors = buildCorsHeaders(origin);

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || undefined;
    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'EMAIL_REQUIRED' },
        { status: 400, headers: cors },
      );
    }

    // import dinamico per evitare errori di build se la funzione non esiste
    const airtable: any = await import('@/lib/airtable').catch(() => ({}));
    const fn = airtable?.getUtenteByEmail;

    if (typeof fn === 'function') {
      const rec = await fn(email);
      const enabled =
        rec?.fields?.Abilitato ??
        rec?.fields?.Enabled ??
        rec?.fields?.enabled ??
        true;
      return NextResponse.json({ ok: true, enabled, record: rec }, { headers: cors });
    }

    // fallback permissivo (dev)
    return NextResponse.json({ ok: true, enabled: true, source: 'fallback' }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors },
    );
  }
}

// POST /api/check-user  body: { email }
export async function POST(req: NextRequest) {
  const origin = readOrigin(req);
  const cors = buildCorsHeaders(origin);

  try {
    const body = await req.json().catch(() => ({}));
    const email: string | undefined = body?.email;
    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'EMAIL_REQUIRED' },
        { status: 400, headers: cors },
      );
    }

    const airtable: any = await import('@/lib/airtable').catch(() => ({}));
    const fn = airtable?.getUtenteByEmail;

    if (typeof fn === 'function') {
      const rec = await fn(email);
      const enabled =
        rec?.fields?.Abilitato ??
        rec?.fields?.Enabled ??
        rec?.fields?.enabled ??
        true;
      return NextResponse.json({ ok: true, enabled, record: rec }, { headers: cors });
    }

    return NextResponse.json({ ok: true, enabled: true, source: 'fallback' }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors },
    );
  }
}
