// app/api/session/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { buildCorsHeaders } from '@/lib/cors';

export const runtime = 'nodejs';
const COOKIE_NAME = 'spst_session';

// Preflight
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

// Login -> crea session cookie da idToken
export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  const cors = buildCorsHeaders(origin);

  try {
    const { idToken } = (await req.json()) as { idToken?: string };
    if (!idToken) {
      return NextResponse.json({ error: 'NO_TOKEN' }, { status: 400, headers: cors });
    }

    const expiresIn = 1000 * 60 * 60 * 24 * 5; // 5 giorni
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
      { error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors },
    );
  }
}

// Logout -> invalida e cancella cookie
export async function DELETE(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  const cors = buildCorsHeaders(origin);

  try {
    const cookie = req.cookies.get(COOKIE_NAME)?.value;

    if (cookie) {
      try {
        const decoded = await adminAuth().verifySessionCookie(cookie);
        await adminAuth().revokeRefreshTokens(decoded.sub);
      } catch {
        // ignora errori di verifica/revoca
      }
    }

    const res = NextResponse.json({ ok: true }, { headers: cors });
    res.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors },
    );
  }
}
