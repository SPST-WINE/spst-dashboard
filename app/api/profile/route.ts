import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { adminAuth } from '@/lib/firebase-admin';
import { getUserProfileByEmail, upsertUserProfile } from '@/lib/airtable';
import type { Party } from '@/lib/airtable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getEmailFromAuth(req: NextRequest): Promise<string | undefined> {
  // 1) Authorization: Bearer <idToken>
  const authHeader = req.headers.get('authorization') ?? '';
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (m) {
    try {
      const decoded = await adminAuth().verifyIdToken(m[1], true);
      return decoded.email || undefined;
    } catch {}
  }
  // 2) Session cookie
  const session = req.cookies.get('spst_session')?.value;
  if (session) {
    try {
      const decoded = await adminAuth().verifySessionCookie(session, true);
      return decoded.email || undefined;
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
    if (!email) return NextResponse.json({ ok: false, error: 'AUTH_REQUIRED' }, { status: 401, headers: cors });

    const { party } = await getUserProfileByEmail(email);
    return NextResponse.json({ ok: true, email, party: party ?? null }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500, headers: cors });
  }
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    const email = await getEmailFromAuth(req);
    if (!email) return NextResponse.json({ ok: false, error: 'AUTH_REQUIRED' }, { status: 401, headers: cors });

    const body = (await req.json()) as { party: Party };
    if (!body?.party) {
      return NextResponse.json({ ok: false, error: 'BAD_REQUEST' }, { status: 400, headers: cors });
    }

    const res = await upsertUserProfile(email, body.party);
    return NextResponse.json({ ok: true, id: res.id }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500, headers: cors });
  }
}
