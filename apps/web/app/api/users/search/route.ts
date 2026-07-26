import { NextRequest, NextResponse } from 'next/server';
import { getUser as auth } from '@/lib/user';
import { db } from '@/lib/db';
import { githubConnections, users, githubStats, codeforcesStats, skills } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ success: false, error: 'Missing username parameter' }, { status: 400 });
  }

  try {
    // Resolve user by github connection username (case-insensitive)
    const connection = await db.query.githubConnections.findFirst({
      where: eq(sql`lower(${githubConnections.username})`, username.toLowerCase()),
      columns: { userId: true },
    });

    if (!connection) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userId = connection.userId;

    const [userRecord, ghStats, cfStats, userSkills] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { name: true },
      }),
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

    return NextResponse.json({
      success: true,
      data: {
        name: userRecord?.name || username,
        username,
        github: ghStats ?? null,
        codeforces: cfStats ?? null,
        skills: userSkills,
      },
    });
  } catch (err) {
    console.error('[search-user] error:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch user data' }, { status: 500 });
  }
}
