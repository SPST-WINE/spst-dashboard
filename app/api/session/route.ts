// app/api/session/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

const COOKIE_NAME = 'spst_session';

// CREATE SESSION COOKIE
export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    const expiresIn = 1000 * 60 * 60 * 24 * 5; // 5 giorni
    // NOTE: adminAuth is a function that returns Auth → va INVOCATA
    const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: expiresIn / 1000,
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'session error' }, { status: 500 });
  }
}

// READ SESSION (validate)
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME)?.value;
    if (!cookie) return NextResponse.json({ authenticated: false });

    const decoded = await adminAuth().verifySessionCookie(cookie, true);
    return NextResponse.json({
      authenticated: true,
      uid: decoded.uid,
      email: decoded.email || null,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

// DELETE SESSION (logout)
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return res;
}
