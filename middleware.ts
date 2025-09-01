import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // proteggi tutte le pagine dashboard
  if (pathname.startsWith('/dashboard')) {
    const session = req.cookies.get('spst_session')?.value;
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }
  // se già loggato e prova ad andare su /login, riportalo su /dashboard
  if (pathname === '/login') {
    const session = req.cookies.get('spst_session')?.value;
    if (session) {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
