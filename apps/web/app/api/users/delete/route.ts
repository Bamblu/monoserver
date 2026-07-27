export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUser as auth } from '@/lib/user';
import { db } from '@/lib/db';
import {
  users,
  accounts,
  githubConnections,
  githubStats,
  codeforcesStats,
  skills,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.id;

  try {
    // Delete dependent tables first
    await db.delete(skills).where(eq(skills.userId, userId));
    await db.delete(githubStats).where(eq(githubStats.userId, userId));
    await db.delete(codeforcesStats).where(eq(codeforcesStats.userId, userId));
    await db.delete(githubConnections).where(eq(githubConnections.userId, userId));
    await db.delete(accounts).where(eq(accounts.userId, userId));
    
    // Delete user from main User table
    await db.delete(users).where(eq(users.id, userId));

    // Clear auth token cookie
    cookies().set('auth_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[delete-account] Failed to delete user ${userId}:`, err);
    return NextResponse.json(
      { success: false, error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
