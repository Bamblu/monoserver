export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/callback
 *
 * Frontend token transfer route.
 * When the backend (NestJS on Render) finishes OAuth authentication, it redirects the browser
 * to this endpoint on the frontend domain (Vercel) with the generated JWT as a query param.
 *
 * This handler receives the request on the frontend origin, sets the HttpOnly `auth_token`
 * cookie directly on the frontend domain, and redirects to the requested destination
 * (/onboarding or /dashboard).
 *
 * This completely resolves cross-origin cookie delivery blocks between Render and Vercel.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const destination = searchParams.get('destination') || '/dashboard';

  // Debug Logging
  console.log('[Auth Callback Transfer]', {
    currentUrl: request.url,
    hasToken: !!token,
    requestedDestination: destination,
    nodeEnv: process.env.NODE_ENV,
  });

  if (!token) {
    console.error('[Auth Callback Transfer] Missing token in query params, redirecting to /login');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'invalid_token');
    return NextResponse.redirect(loginUrl);
  }

  // Validate destination to prevent open-redirect security vulnerabilities
  let safeDestination = '/dashboard';
  if (destination.startsWith('/onboarding') || destination.startsWith('/dashboard') || destination.startsWith('/settings')) {
    safeDestination = destination;
  }

  const redirectUrl = new URL(safeDestination, request.url);
  const response = NextResponse.redirect(redirectUrl);

  const isProd = process.env.NODE_ENV === 'production';

  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });

  console.log('[Auth Callback Transfer] Set auth_token cookie successfully on frontend origin', {
    redirectTarget: redirectUrl.toString(),
    cookieOptions: { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 },
  });

  return response;
}
