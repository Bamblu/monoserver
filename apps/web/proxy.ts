import { NextRequest, NextResponse } from 'next/server';

// ─── Route Config ─────────────────────────────────────────────────────────────

const PUBLIC_ROUTES = new Set(['/login', '/register', '/api/card']);
const AUTH_ROUTES = new Set(['/login', '/register']);

// ─── Rate Limiting ────────────────────────────────────────────────────────────

// Simple sliding window via Upstash Redis.
// We import dynamically to keep the middleware bundle lean.
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

// ─── Proxy (Middleware) ───────────────────────────────────────────────────────

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internals + static assets through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Rate limit all API routes
  if (pathname.startsWith('/api')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
    const allowed = await checkRateLimit(ip).catch(() => true); // fail open
    if (!allowed) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
      });
    }
  }

  // Allow public routes without auth
  const isPublic = [...PUBLIC_ROUTES].some((route) => pathname.startsWith(route));
  if (isPublic) return NextResponse.next();

  // Check auth session via auth_token cookie
  const authToken = request.cookies.get('auth_token')?.value;

  // Redirect authenticated users away from auth pages
  if (authToken && AUTH_ROUTES.has(pathname)) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // Redirect unauthenticated users to login
  if (!authToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

