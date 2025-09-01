// app/api/check-user/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { getUtenteByEmail } from '@/lib/airtable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Preflight
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

// POST { email } -> { ok, allowed, record? }
export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    const body = await req.json().catch(() => ({}));
    const email = (body?.email ?? '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'EMAIL_REQUIRED' },
        { status: 400, headers: cors }
      );
    }

    const rec = await getUtenteByEmail(email);

    return NextResponse.json(
      {
        ok: true,
        allowed: !!rec,
        record: rec, // { id, fields } | null
      },
      { headers: cors }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}
