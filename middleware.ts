import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define protected routes
const protectedRoutes = ['/dashboard', '/profile', '/settings'];

// Define auth routes (redirect to dashboard if already authenticated)
const authRoutes = ['/auth/signin', '/auth/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the token from the request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect to sign-in if accessing protected route without token
  if (isProtectedRoute && !token) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if accessing auth routes with valid token
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
