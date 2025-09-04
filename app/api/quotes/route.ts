import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { adminAuth } from '@/lib/firebase-admin';
import { createPreventivoBozza, listPreventiviByEmail } from '@/lib/airtable.quotes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getEmailFromAuth(req: NextRequest): Promise<string | undefined> {
  // Bearer
  const m = (req.headers.get('authorization') ?? '').match(/^Bearer\s+(.+)$/i);
  if (m) {
    try {
      const decoded = await adminAuth().verifyIdToken(m[1], true);
      return decoded.email || decoded.firebase?.identities?.email?.[0] || undefined;
    } catch {}
  }
  // Cookie
  const session = req.cookies.get('spst_session')?.value;
  if (session) {
    try {
      const decoded = await adminAuth().verifySessionCookie(session, true);
      return decoded.email || decoded.firebase?.identities?.email?.[0] || undefined;
    } catch {}
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || (await getEmailFromAuth(req));
    if (!email) return NextResponse.json({ ok: true, rows: [] }, { headers: cors });

    const rows = await listPreventiviByEmail(email);
    return NextResponse.json({ ok: true, rows }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500, headers: cors });
  }
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);
  try {
    const body = await req.json();
    const email = body.createdByEmail || (await getEmailFromAuth(req));
    if (!email) return NextResponse.json({ ok: false, error: 'MISSING_EMAIL' }, { status: 400, headers: cors });

    const { id } = await createPreventivoBozza(body, email);
    return NextResponse.json({ ok: true, id }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500, headers: cors });
  }
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}
