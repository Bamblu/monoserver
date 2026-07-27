export const dynamic = 'force-dynamic';

/**
 * GET /api/compare/resolve?username={username}
 *
 * Resolves a GitHub username to a full CompareProfile.
 *
 * If the user exists in Bamblu → uses cached DB data (fast path).
 * If not → fetches from GitHub + attempts Codeforces linking (cold path).
 *
 * All caching is handled by externalProfileService.
 * GitHub tokens are NEVER returned to the frontend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser as auth } from '@/lib/user';
import {
  resolveCompareProfile,
} from '@/lib/services/externalProfileService';
import { GitHubNotFoundError, GitHubRateLimitError } from '@/lib/services/githubSearchService';

export const runtime = 'nodejs';
export const maxDuration = 30;

// ─── Username validation regex ────────────────────────────────────────────────
const GH_USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

export async function GET(request: NextRequest) {
  // 1. Auth check (optional — public resolution allowed)
  const session = await auth().catch(() => null);

  // 2. Parse + validate username
  const { searchParams } = new URL(request.url);
  const username = (searchParams.get('username') ?? '').trim();

  if (!username) {
    return NextResponse.json(
      { success: false, error: 'Missing username parameter' },
      { status: 400 }
    );
  }

  if (!GH_USERNAME_RE.test(username)) {
    return NextResponse.json(
      { success: false, error: 'Invalid GitHub username format' },
      { status: 400 }
    );
  }

  // 3. Resolve profile (uses multi-layer caching internally)
  try {
    const profile = await resolveCompareProfile(username);
    return NextResponse.json({ success: true, data: profile });
  } catch (err) {
    if (err instanceof GitHubNotFoundError) {
      return NextResponse.json(
        { success: false, error: `GitHub user "${username}" not found.` },
        { status: 404 }
      );
    }
    if (err instanceof GitHubRateLimitError) {
      return NextResponse.json(
        {
          success: false,
          error: 'GitHub is temporarily rate-limited. Please try again in a moment.',
          rateLimitReset: err.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }
    console.error('[compare/resolve] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load profile. Please try again.' },
      { status: 500 }
    );
  }
}
