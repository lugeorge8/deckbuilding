import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin passcode gate for persistent collection/cart
  if (pathname.startsWith('/collection') || pathname.startsWith('/cart')) {
    const authed = req.cookies.get('deckbuilding_admin')?.value === '1';
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin-login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/collection/:path*', '/cart/:path*'],
};
