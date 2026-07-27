export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { getUser as auth } from '@/lib/user';
import { db } from '@/lib/db';
import { codeforcesStats } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { RoadmapShell } from '@/components/roadmap/RoadmapShell';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Roadmap — Bamblu' };

export default async function RoadmapPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = session.id;

  // Load latest Codeforces stats to pre-populate goals
  const cfStatsRow = await db.query.codeforcesStats.findFirst({
    where: eq(codeforcesStats.userId, userId),
    orderBy: desc(codeforcesStats.snapshotAt),
  });

  return (
    <RoadmapShell
      initialCfRating={cfStatsRow?.rating ?? 0}
      initialSolvedCount={cfStatsRow?.solvedCount ?? 0}
    />
  );
}
