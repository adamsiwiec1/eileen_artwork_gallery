import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const url = req.nextUrl.clone();
  const isAdminHost = host.startsWith('admin.');

  if (isAdminHost && !url.pathname.startsWith('/admin') && !url.pathname.startsWith('/api')) {
    url.pathname = url.pathname === '/' ? '/admin' : `/admin${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  const isAdminPage = url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/login');
  if (isAdminPage && !req.cookies.get('admin_session')?.value) {
    url.pathname = '/admin/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
