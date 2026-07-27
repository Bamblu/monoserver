export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { getUser as auth } from '@/lib/user';
import { db } from '@/lib/db';
import { users, githubConnections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { SettingsShell } from '@/components/settings/SettingsShell';

export const metadata: Metadata = { title: 'Settings — Bamblu' };

export default async function SettingsPage() {
  const session = await auth();

  // Fetch user and GitHub connection
  const [user, ghConnection] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, session!.id),
    }),
    db.query.githubConnections.findFirst({
      where: eq(githubConnections.userId, session!.id),
      columns: { username: true },
    }),
  ]);

  return (
    <SettingsShell
      githubUsername={ghConnection?.username ?? null}
      codeforcesHandle={user?.codeforcesHandle ?? null}
    />
  );
}
