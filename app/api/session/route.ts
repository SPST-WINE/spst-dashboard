// app/api/session/route.ts
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

const COOKIE_NAME = process.env.FIREBASE_SESSION_COOKIE_NAME || 'spst_session';

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error: 'missing idToken' }, { status: 400 });

    const expiresIn = 1000 * 60 * 60 * 24 * 5; // 5 giorni
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: expiresIn / 1000,
      path: '/',
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'session error' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(process.env.FIREBASE_SESSION_COOKIE_NAME || 'spst_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return res;
}
