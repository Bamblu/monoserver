export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUser as auth } from '@/lib/user';
import { db } from '@/lib/db';
import { githubStats, codeforcesStats, skills } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getCache, setCache, cacheKeys, TTL } from '@/lib/redis';

export const runtime = 'nodejs';

interface StatsResponse {
  github: typeof githubStats.$inferSelect | null;
  codeforces: typeof codeforcesStats.$inferSelect | null;
  skills: (typeof skills.$inferSelect)[];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  // Allow users to only view their own stats (or we'd need public profile logic)
  if (session.id !== id) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = cacheKeys.userStats(id);
  const cached = await getCache<StatsResponse>(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, data: cached });
  }

  const [ghStats, cfStats, userSkills] = await Promise.all([
    db.query.githubStats.findFirst({
      where: eq(githubStats.userId, id),
      orderBy: desc(githubStats.snapshotAt),
    }),
    db.query.codeforcesStats.findFirst({
      where: eq(codeforcesStats.userId, id),
      orderBy: desc(codeforcesStats.snapshotAt),
    }),
    db.query.skills.findMany({
      where: eq(skills.userId, id),
    }),
  ]);

  const data: StatsResponse = {
    github: ghStats ?? null,
    codeforces: cfStats ?? null,
    skills: userSkills,
  };

  await setCache(cacheKey, data, TTL.MEDIUM);

  return NextResponse.json({ success: true, data });
}
