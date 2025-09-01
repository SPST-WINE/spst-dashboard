// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

const COOKIE_NAME = process.env.FIREBASE_SESSION_COOKIE_NAME || 'spst_session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // proteggi solo l'area /dashboard
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) {
    const url = new URL(`/login?next=${encodeURIComponent(req.nextUrl.pathname)}`, req.url);
    return NextResponse.redirect(url);
  }

  try {
    await adminAuth.verifySessionCookie(cookie, true);
    return NextResponse.next();
  } catch {
    const url = new URL(`/login?next=${encodeURIComponent(req.nextUrl.pathname)}`, req.url);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
