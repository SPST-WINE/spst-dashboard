// app/api/session/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'spst_session';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    const { idToken, email: emailFromBody } = await req.json();

    if (!idToken) {
      return NextResponse.json(
        { ok: false, error: 'TOKEN_REQUIRED' },
        { status: 400, headers: cors }
      );
    }

    // Verifica token ed estrai (se c’è) l’email
    const decoded = await adminAuth().verifyIdToken(idToken, true);

    let email: string | undefined =
      decoded.email || decoded.firebase?.identities?.email?.[0] || emailFromBody;

    // Fallback: prova a leggere dal record utente
    if (!email) {
      const user = await adminAuth().getUser(decoded.uid);
      email = user.email || undefined;
    }

    // Crea Session Cookie (5 giorni)
    const expiresIn = 1000 * 60 * 60 * 24 * 5;
    const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn });

    const res = NextResponse.json({ ok: true, email: email ?? null }, { headers: cors });
    res.cookies.set(COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: expiresIn / 1000,
    });

    return res;
  } catch (e: any) {
    // Log server (visibile su Vercel)
    console.error('SESSION_POST_ERROR', e?.message || e);
    return NextResponse.json(
      { ok: false, error: 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}
