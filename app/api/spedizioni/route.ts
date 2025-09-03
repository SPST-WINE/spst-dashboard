// app/api/spedizioni/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { adminAuth } from '@/lib/firebase-admin';
import { createSpedizioneWebApp, listSpedizioni } from '@/lib/airtable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getEmailFromAuth(req: NextRequest): Promise<string | undefined> {
  // 1) Bearer ID token
  const m = (req.headers.get('authorization') ?? '').match(/^Bearer\s+(.+)$/i);
  if (m) {
    try {
      const d = await adminAuth().verifyIdToken(m[1], true);
      return d.email || d.firebase?.identities?.email?.[0] || undefined;
    } catch {}
  }
  // 2) Session cookie
  const session = req.cookies.get('spst_session')?.value;
  if (session) {
    try {
      const d = await adminAuth().verifySessionCookie(session, true);
      return d.email || d.firebase?.identities?.email?.[0] || undefined;
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
    const email = await getEmailFromAuth(req);
    const rows = await listSpedizioni(email ? { email } : undefined);
    return NextResponse.json({ ok: true, rows }, { headers: cors });
  } catch (e: any) {
    console.error('SPEDIZIONI_GET_ERROR', e?.message || e);
    return NextResponse.json({ ok: false, error: 'SERVER_ERROR' }, { status: 500, headers: cors });
  }
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);
  try {
    const payload = await req.json();
    if (!payload.createdByEmail) {
      const email = await getEmailFromAuth(req);
      if (email) payload.createdByEmail = email;
    }
    const res = await createSpedizioneWebApp(payload);
return NextResponse.json({ ok: true, id: res.id, idSped: res.idSpedizione }, { headers: cors });
  } catch (e: any) {
    console.error('SPEDIZIONI_POST_ERROR', e?.message || e);
    return NextResponse.json({ ok: false, error: 'SERVER_ERROR' }, { status: 500, headers: cors });
  }
}
