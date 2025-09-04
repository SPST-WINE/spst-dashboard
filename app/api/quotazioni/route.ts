// app/api/quotazioni/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { adminAuth } from '@/lib/firebase-admin';
import { createPreventivo, listPreventivi, type QuotePayload } from '@/lib/quotes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getEmailFromAuth(req: NextRequest): Promise<string | undefined> {
  // 1) Bearer
  const m = (req.headers.get('authorization') ?? '').match(/^Bearer\s+(.+)$/i);
  if (m) {
    try {
      const decoded = await adminAuth().verifyIdToken(m[1], true);
      return decoded.email || decoded.firebase?.identities?.email?.[0] || undefined;
    } catch {}
  }
  // 2) Session cookie
  const session = req.cookies.get('spst_session')?.value;
  if (session) {
    try {
      const decoded = await adminAuth().verifySessionCookie(session, true);
      return decoded.email || decoded.firebase?.identities?.email?.[0] || undefined;
    } catch {}
  }
  return undefined;
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get('email') || undefined;
    const q = searchParams.get('q') || undefined;

    const email = emailParam || (await getEmailFromAuth(req));
    const rows = await listPreventivi(email ? { email, q: q || undefined } : { q: q || undefined });

    return NextResponse.json({ ok: true, rows }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500, headers: cors });
  }
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    const payload = (await req.json()) as QuotePayload;

    if (!payload.createdByEmail) {
      const email = await getEmailFromAuth(req);
      if (email) payload.createdByEmail = email;
    }

    // Validazione minima
    if (!payload?.mittente?.ragioneSociale || !payload?.destinatario?.ragioneSociale) {
      return NextResponse.json({ ok: false, error: 'DATI_MINIMI_MANCANTI' }, { status: 400, headers: cors });
    }

    const created = await createPreventivo(payload);

    return NextResponse.json({ ok: true, id: created.id }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500, headers: cors });
  }
}
