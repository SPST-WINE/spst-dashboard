// app/api/quotes/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { adminAuth } from '@/lib/firebase-admin';
import {
  createPreventivo,
  listPreventivi,
  airtableQuotesStatus, // 👈 debug
} from '@/lib/airtable.quotes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

async function getEmailFromAuth(req: NextRequest): Promise<string | undefined> {
  const m = (req.headers.get('authorization') ?? '').match(/^Bearer\s+(.+)$/i);
  if (m) {
    try {
      const decoded = await adminAuth().verifyIdToken(m[1], true);
      return decoded.email || decoded.firebase?.identities?.email?.[0] || undefined;
    } catch {}
  }
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

    // 👇 Debug rapido: /api/quotes?debug=env
    if ((searchParams.get('debug') || '').toLowerCase() === 'env') {
      const status = await airtableQuotesStatus();
      return NextResponse.json({ ok: true, debug: status }, { headers: cors });
    }

    const emailParam = searchParams.get('email') || undefined;
    const email = emailParam || (await getEmailFromAuth(req));

    const rows = await listPreventivi(email ? { email } : undefined);
    return NextResponse.json({ ok: true, rows }, { headers: cors });
  } catch (e: any) {
    console.error('[quotes:GET] error', {
      message: e?.message,
      stack: e?.stack,
    });
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    const payload: any = await req.json();

    // Bootstrap sessione via token (facoltativo)
    if (payload?.token) {
      const sessionCookie = await adminAuth().createSessionCookie(payload.token, {
        expiresIn: 60 * 60 * 24 * 5 * 1000,
      });
      const res = NextResponse.json({ ok: true, message: 'Sessione creata' }, { headers: cors });
      res.cookies.set({
        name: 'spst_session',
        value: sessionCookie,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });
      return res;
    }

    if (!payload.createdByEmail) {
      const email = await getEmailFromAuth(req);
      if (email) payload.createdByEmail = email;
    }

    const created = await createPreventivo(payload);
    return NextResponse.json({ ok: true, id: created.id }, { headers: cors });
  } catch (e: any) {
    // 👇 Log esteso (lo vedi nei logs Vercel)
    console.error('[quotes:POST] creation failed', {
      errMessage: e?.message,
      errType: e?.error?.type,
      errStatus: e?.statusCode,
      airtable: e?.error,
    });
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}
