import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_PATHS = ['/login', '/admin/login', '/api/admin/auth', '/api/public'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
}

function isAdminPath(pathname: string): boolean {
  return (
    (pathname.startsWith('/admin') && pathname !== '/admin/login') ||
    (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth'))
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const { user, supabaseResponse } = await updateSession(request);

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Admin routes require admin role (from user_metadata set at creation)
  if (isAdminPath(pathname)) {
    const role = user.user_metadata?.role;
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
