export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { users, githubStats, codeforcesStats, githubConnections, skills } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { StatCard } from '@/components/dashboard/StatCard';
import { SkillRadar } from '@/components/dashboard/SkillRadar';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { getCFRankColor } from '@bamblu/utils';

interface ProfilePageProps {
  params: { username: string };
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  return { title: `@${params.username} — Profile` };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = params;

  // Resolve user id from GitHub username (case-insensitive)
  const ghConnection = await db.query.githubConnections.findFirst({
    where: eq(sql`lower(${githubConnections.username})`, username.toLowerCase()),
    columns: { userId: true },
  });

  if (!ghConnection) notFound();

  const user = await db.query.users.findFirst({
    where: eq(users.id, ghConnection.userId),
  });

  if (!user) notFound();

  // Load stats and skills
  const [ghStatsRow, cfStatsRow, userSkills] = await Promise.all([
    db.query.githubStats.findFirst({
      where: eq(githubStats.userId, user.id),
      orderBy: desc(githubStats.snapshotAt),
    }),
    db.query.codeforcesStats.findFirst({
      where: eq(codeforcesStats.userId, user.id),
      orderBy: desc(codeforcesStats.snapshotAt),
    }),
    db.query.skills.findMany({
      where: eq(skills.userId, user.id),
    }),
  ]);

  const cfRankColor = getCFRankColor(cfStatsRow?.rank ?? '');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header Card ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-[#0F1929] border border-white/[0.06] p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
        <UserAvatar
          id="profile-avatar"
          src={user.image}
          name={user.name ?? username}
          size="xl"
          className="ring-2 ring-white/10"
        />
        
        <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left gap-1 mt-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            {user.name ?? username}
          </h1>
          
          <p className="text-slate-400 text-sm font-medium">
            @{username} · Codeforces
          </p>
          
          {cfStatsRow && (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs font-semibold mt-2 text-[#06B6D4]">
              <span>Rating: {cfStatsRow.rating}</span>
              <span className="text-slate-600">•</span>
              <span style={{ color: cfRankColor }}>Rank: {cfStatsRow.rank}</span>
              <span className="text-slate-600">•</span>
              <span>{cfStatsRow.solvedCount} Problems Solved</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Stat Cards Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          id="profile-problems-solved"
          label="Problems Solved"
          value={cfStatsRow?.solvedCount ?? 0}
        />
        <StatCard
          id="profile-active-days"
          label="Active Days"
          value={ghStatsRow?.contributionStreak ?? 0}
        />
        <StatCard
          id="profile-contest-rating"
          label="Contest Rating"
          value={cfStatsRow?.rating ?? 0}
        />
        <StatCard
          id="profile-github-contrib"
          label="GitHub Contrib."
          value={ghStatsRow?.totalCommits ?? 0}
        />
      </div>

      {/* ── Charts Grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkillRadar skills={userSkills} />
        <ActivityHeatmap heatmapData={ghStatsRow?.contributionHeatmap ?? undefined} />
      </div>
    </div>
  );
}
