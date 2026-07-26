import type { Metadata } from 'next';
import { getUser as auth } from '@/lib/user';
import { db } from '@/lib/db';
import { users, githubConnections, githubStats, codeforcesStats, skills } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { CompareShell } from '@/components/compare/CompareShell';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Compare Developers — Bamblu' };

export default async function ComparePage() {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = session.id;

  // Fetch logged in user's details and connections
  const [user, ghConnection] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, userId),
    }),
    db.query.githubConnections.findFirst({
      where: eq(githubConnections.userId, userId),
      columns: { username: true },
    }),
  ]);

  if (!user || !ghConnection) {
    // If not onboarded (missing github connection), redirect back to onboarding
    redirect('/onboarding');
  }

  // Load stats and skills
  const [ghStatsRow, cfStatsRow, userSkills] = await Promise.all([
    db.query.githubStats.findFirst({
      where: eq(githubStats.userId, userId),
      orderBy: desc(githubStats.snapshotAt),
    }),
    db.query.codeforcesStats.findFirst({
      where: eq(codeforcesStats.userId, userId),
      orderBy: desc(codeforcesStats.snapshotAt),
    }),
    db.query.skills.findMany({
      where: eq(skills.userId, userId),
    }),
  ]);

  const user1 = {
    name: user.name || ghConnection.username,
    username: ghConnection.username,
    github: ghStatsRow
      ? {
          totalCommits: ghStatsRow.totalCommits,
          contributionStreak: ghStatsRow.contributionStreak,
        }
      : null,
    codeforces: cfStatsRow
      ? {
          rating: cfStatsRow.rating,
          rank: cfStatsRow.rank ?? '',
          solvedCount: cfStatsRow.solvedCount,
        }
      : null,
    skills: userSkills.map((s) => ({
      name: s.name,
      level: s.level,
      category: s.category,
    })),
  };

  return <CompareShell user1={user1} />;
}
