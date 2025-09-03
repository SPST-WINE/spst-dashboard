// app/api/spedizioni/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { adminAuth } from '@/lib/firebase-admin';
import { createSpedizioneWebApp, listSpedizioni } from '@/lib/airtable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

async function getEmailFromAuth(req: NextRequest): Promise<string | undefined> {
  // 1) Bearer token
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

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    // override via query string (?email=...)
    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get('email') || undefined;

    const email = emailParam || (await getEmailFromAuth(req));
    const rows = await listSpedizioni(email ? { email } : undefined);

    // 🔧 Flatten per retrocompatibilità UI: { id, ...fields, fields }
    const data = rows.map((r: any) => ({
      id: r.id,
      ...(r.fields || {}),
      fields: r.fields || {},
    }));

    return NextResponse.json({ ok: true, rows: data }, { headers: cors });
  } catch (e: any) {
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

    // Se arriva un token, crea session cookie
    if (payload.token) {
      const sessionCookie = await adminAuth().createSessionCookie(payload.token, {
        expiresIn: 60 * 60 * 24 * 5 * 1000, // 5 giorni
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

    // Fallback: valorizza createdByEmail se mancante
    if (!payload.createdByEmail) {
      const email = await getEmailFromAuth(req);
      if (email) payload.createdByEmail = email;
    }

    const created = await createSpedizioneWebApp(payload);
    return NextResponse.json(
      { ok: true, id: created.id, idSpedizione: created.idSpedizione },
      { headers: cors }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}
