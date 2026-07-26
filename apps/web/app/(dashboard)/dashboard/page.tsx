import type { Metadata } from 'next';
import { getUser as auth } from '@/lib/user';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { githubStats, codeforcesStats, skills, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export const metadata: Metadata = { title: 'Dashboard — Bamblu' };

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');
  const userId = session.id;

  const [ghStats, cfStats, userSkills, userRow] = await Promise.all([
    db.query.githubStats.findFirst({
      where: eq(githubStats.userId, userId),
      orderBy: desc(githubStats.snapshotAt),
    }),
    db.query.codeforcesStats.findFirst({
      where: eq(codeforcesStats.userId, userId),
      orderBy: desc(codeforcesStats.snapshotAt),
    }),
    db.query.skills.findMany({ where: eq(skills.userId, userId) }),
    db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        codeforcesSyncStatus: true,
        codeforcesLastSyncedAt: true,
      },
    }),
  ]);

  const syncStatus = userRow?.codeforcesSyncStatus ?? 'idle';
  const lastSyncedAt = userRow?.codeforcesLastSyncedAt ?? null;
  const hasData = !!(ghStats || cfStats);

  return (
    <DashboardShell
      userId={userId}
      ghStats={ghStats ?? null}
      cfStats={cfStats ?? null}
      skills={userSkills}
      syncStatus={syncStatus}
      lastSyncedAt={lastSyncedAt?.toISOString() ?? null}
      hasData={hasData}
    />
  );
}
