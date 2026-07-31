import { NextRequest, NextResponse } from 'next/server';

// ─── Route Config ─────────────────────────────────────────────────────────────

const PUBLIC_ROUTES = new Set(['/', '/login', '/register', '/api/card']);
const AUTH_ROUTES = new Set(['/login', '/register']);

// ─── Rate Limiting ────────────────────────────────────────────────────────────

async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `bamblu:rl:${ip}`;
  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const limit = 120;       // 120 requests per minute

  const lib = await import('@/lib/redis');
  if (!lib.redis) return true; // redis placeholder bypass
  const pipeline = lib.redis.pipeline();
  pipeline.zremrangebyscore(key, 0, now - windowMs);
  pipeline.zadd(key, { score: now, member: `${now}` });
  pipeline.zcard(key);
  pipeline.expire(key, 60);

  const results = await pipeline.exec();
  const count = results[2] as number;

  return count <= limit;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow Next.js internals, static assets, and favicon through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Rate limit API routes and allow API handlers to run
  if (pathname.startsWith('/api')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
    const allowed = await checkRateLimit(ip).catch(() => true); // fail open
    if (!allowed) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
      });
    }
    // Allow API routes to handle their own authentication and return JSON (e.g. 401)
    return NextResponse.next();
  }

  // Check auth session via auth_token cookie
  const authToken = request.cookies.get('auth_token')?.value;
  const hasError = request.nextUrl.searchParams.has('error');
  const errorParam = request.nextUrl.searchParams.get('error');

  // 2.5. Handle stale cookies and infinite loops
  // If the user lands on login with an error param, delete their cookie to break the loop
  if (pathname === '/login' && errorParam) {
    const response = NextResponse.next();
    response.cookies.delete('auth_token');
    return response;
  }

  // 3. Redirect authenticated users away from auth pages (/login, /register)
  if (authToken && !hasError && AUTH_ROUTES.has(pathname)) {
    const targetUrl = new URL('/dashboard', request.url);
    console.log('[Middleware Decision]', {
      currentUrl: pathname,
      cookiePresent: true,
      decision: 'Redirect authenticated user away from login',
      redirectTarget: targetUrl.pathname,
    });
    return NextResponse.redirect(targetUrl);
  }

  // 4. Allow public routes (Landing `/`, `/login`, `/register`)
  const isPublic = pathname === '/' || PUBLIC_ROUTES.has(pathname);
  if (isPublic) {
    console.log('[Middleware Decision]', {
      currentUrl: pathname,
      cookiePresent: !!authToken,
      decision: 'Allow public route',
      redirectTarget: null,
    });
    return NextResponse.next();
  }

  // 5. Redirect unauthenticated users to login for protected routes (/dashboard, /onboarding, etc.)
  if (!authToken) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    console.log('[Middleware Decision]', {
      currentUrl: pathname,
      cookiePresent: false,
      decision: 'Redirect unauthenticated user to login',
      redirectTarget: loginUrl.toString(),
    });
    return NextResponse.redirect(loginUrl);
  }

  console.log('[Middleware Decision]', {
    currentUrl: pathname,
    cookiePresent: true,
    decision: 'Allow protected route access',
    redirectTarget: null,
  });

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
