// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// usa lo stesso nome che imposti in /api/session
const COOKIE_NAME = process.env.FIREBASE_SESSION_COOKIE_NAME || 'spst_session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Proteggi solo l'area riservata
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // Edge-safe: controlla SOLO se il cookie esiste (niente firebase-admin qui)
  const hasSession = Boolean(req.cookies.get(COOKIE_NAME)?.value);

  if (!hasSession) {
    const url = new URL(`/login?next=${encodeURIComponent(req.nextUrl.pathname)}`, req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
