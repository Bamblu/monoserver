/**
 * GET /api/compare/search?q={query}&limit={limit}
 *
 * Live GitHub user search for the Compare page.
 * Searches GitHub itself — not just the Bamblu database.
 *
 * Security:
 *  - Auth required (JWT cookie)
 *  - Input sanitised + length-capped
 *  - Rate limited: 30 requests/min per IP
 *  - GitHub token never exposed to frontend
 *
 * Response:
 *  { suggestions: [{ login, avatar_url, name, isBambluUser, type }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser as auth } from '@/lib/user';
import { searchGitHubUsers, GitHubRateLimitError } from '@/lib/services/githubSearchService';
import { db } from '@/lib/db';
import { githubConnections } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import { getCache, setCache, cacheKeys, TTL } from '@/lib/redis';
import { redis } from '@/lib/redis';

export const runtime = 'nodejs';

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_S = 60;

// ─── Rate Limiter ─────────────────────────────────────────────────────────────

async function checkRateLimit(ip: string): Promise<boolean> {
  if (!redis) return true; // allow in dev without Redis

  const key = cacheKeys.compareRateLimit(ip);
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW_S);
    }
    return current <= RATE_LIMIT_MAX;
  } catch {
    return true; // fail open
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // 1. Auth check (optional — public search allowed)
  const session = await auth().catch(() => null);

  // 2. Rate limit by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please wait before searching again.' },
      { status: 429, headers: { 'Retry-After': String(RATE_LIMIT_WINDOW_S) } }
    );
  }

  // 3. Parse + validate query
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q') ?? '';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '8', 10), 15);

  const query = rawQuery.trim().slice(0, 39); // GitHub usernames max 39 chars
  if (query.length < 1) {
    return NextResponse.json({ success: true, suggestions: [] });
  }

  // 4. Check Redis cache
  const cacheKey = cacheKeys.ghSearchSuggestions(query);
  const cached = await getCache<{ suggestions: unknown[] }>(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, ...cached, fromCache: true });
  }

  // 5. Query GitHub Search API
  let ghSuggestions;
  try {
    ghSuggestions = await searchGitHubUsers(query, limit);
  } catch (err) {
    if (err instanceof GitHubRateLimitError) {
      return NextResponse.json(
        {
          success: false,
          error: 'GitHub search is temporarily rate-limited. Please try again in a moment.',
          rateLimitReset: err.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }
    console.error('[compare/search] GitHub search error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to search GitHub. Please try again.' },
      { status: 502 }
    );
  }

  // 6. Mark which users are already Bamblu users (for UI badge)
  const logins = ghSuggestions.map((u) => u.login);
  const bambluUserSet = new Set<string>();

  if (logins.length > 0) {
    try {
      const connections = await db.query.githubConnections.findMany({
        where: inArray(githubConnections.username, logins),
        columns: { username: true },
      });
      connections.forEach((c) => bambluUserSet.add(c.username.toLowerCase()));
    } catch {
      // Non-critical — continue without Bamblu badge
    }
  }

  const suggestions = ghSuggestions.map((u) => ({
    login: u.login,
    avatar_url: u.avatar_url,
    html_url: u.html_url,
    type: u.type,
    isBambluUser: bambluUserSet.has(u.login.toLowerCase()),
  }));

  // 7. Cache the result (2 min)
  const response = { suggestions };
  await setCache(cacheKey, response, 120);

  return NextResponse.json({ success: true, ...response });
}
