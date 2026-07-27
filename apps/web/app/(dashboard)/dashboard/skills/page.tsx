export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { getUser as auth } from '@/lib/user';
import { db } from '@/lib/db';
import { skills } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { SkillRadar } from '@/components/dashboard/SkillRadar';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Skills — Bamblu' };

export default async function SkillsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = session.id;

  // Load all skills for the user
  const userSkills = await db.query.skills.findMany({
    where: eq(skills.userId, userId),
  });

  return (
    <div className="w-full flex-1 flex flex-col justify-between space-y-4 animate-fade-in">
      <div className="shrink-0">
        <h1 className="text-3xl font-bold text-white tracking-tight">Coding Skills</h1>
        <p className="text-slate-400 text-sm mt-1">
          Detailed overview of your algorithmic and syntax proficiencies.
        </p>
      </div>

      <div className="flex-1 min-h-[460px]">
        <SkillRadar skills={userSkills} />
      </div>
    </div>
  );
}
