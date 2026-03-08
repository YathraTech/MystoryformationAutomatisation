import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_PATHS = ['/login', '/admin/login', '/partenaire/login', '/api/admin/auth', '/api/partenaire/auth', '/api/public', '/examen', '/api/examen', '/api/inscription', '/inscription-gagny', '/inscription-sarcelles'];

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

function isPartenairePath(pathname: string): boolean {
  return (
    (pathname.startsWith('/partenaire') && pathname !== '/partenaire/login') ||
    (pathname.startsWith('/api/partenaire') && !pathname.startsWith('/api/partenaire/auth'))
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const { user, supabaseResponse } = await updateSession(request);

  if (!user) {
    // Redirect to partenaire login if accessing partenaire paths
    if (isPartenairePath(pathname)) {
      return NextResponse.redirect(new URL('/partenaire/login', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const role = user.user_metadata?.role;

  // Partenaire routes require partenaire role
  if (isPartenairePath(pathname)) {
    if (role !== 'partenaire') {
      return NextResponse.redirect(new URL('/partenaire/login', request.url));
    }
  }

  // Admin routes require admin, staff or commercial role
  if (isAdminPath(pathname)) {
    const allowedRoles = ['admin', 'staff', 'commercial'];
    if (!role || !allowedRoles.includes(role)) {
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
