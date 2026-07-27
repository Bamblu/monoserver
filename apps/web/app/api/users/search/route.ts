export const dynamic = 'force-dynamic';

/**
 * GET /api/users/search?username={username}
 *
 * Legacy search endpoint — now delegates to compare/resolve for full profile data.
 * Kept for backwards compatibility with any existing callers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser as auth } from '@/lib/user';
import { resolveCompareProfile } from '@/lib/services/externalProfileService';
import { GitHubNotFoundError, GitHubRateLimitError } from '@/lib/services/githubSearchService';

export const runtime = 'nodejs';

const GH_USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

export async function GET(request: NextRequest) {
  const session = await auth().catch(() => null);

  const { searchParams } = new URL(request.url);
  const username = (searchParams.get('username') ?? '').trim();

  if (!username || !GH_USERNAME_RE.test(username)) {
    return NextResponse.json({ success: false, error: 'Invalid username' }, { status: 400 });
  }

  try {
    const profile = await resolveCompareProfile(username);

    // Return in the shape the original CompareShell expected
    return NextResponse.json({
      success: true,
      data: {
        name: profile.displayName ?? profile.login,
        username: profile.login,
        github: profile.github
          ? {
              totalCommits: profile.github.totalCommits,
              contributionStreak: profile.github.contributionStreak,
            }
          : null,
        codeforces: profile.codeforces
          ? {
              rating: profile.codeforces.rating,
              rank: profile.codeforces.rank,
              solvedCount: profile.codeforces.solvedCount,
            }
          : null,
        skills: profile.skills,
      },
    });
  } catch (err) {
    if (err instanceof GitHubNotFoundError) {
      return NextResponse.json(
        { success: false, error: `GitHub user "${username}" not found.` },
        { status: 404 }
      );
    }
    if (err instanceof GitHubRateLimitError) {
      return NextResponse.json(
        { success: false, error: 'Rate limited. Please try again in a moment.' },
        { status: 429 }
      );
    }
    return NextResponse.json({ success: false, error: 'Failed to load user.' }, { status: 500 });
  }
}
