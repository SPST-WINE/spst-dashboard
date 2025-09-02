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

    // Verifica il token e prova a leggere l'email dai claim
    const decoded = await adminAuth().verifyIdToken(idToken, true);

    let email: string | undefined =
      decoded.email || decoded.firebase?.identities?.email?.[0] || emailFromBody;

    // Fallback: se ancora assente, leggi dal user record
    if (!email) {
      const user = await adminAuth().getUser(decoded.uid);
      email = user.email ?? undefined;
    }

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'EMAIL_REQUIRED' },
        { status: 400, headers: cors }
      );
    }

    // Crea il Firebase Session Cookie (5 giorni)
    const expiresIn = 1000 * 60 * 60 * 24 * 5;
    const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn });

    const res = NextResponse.json({ ok: true }, { headers: cors });
    res.cookies.set(COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(expiresIn / 1000),
    });

    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}
