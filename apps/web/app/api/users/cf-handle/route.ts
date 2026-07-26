import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/user';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getUser();
    if (!session || !session.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { handle } = body;

    if (!handle || typeof handle !== 'string' || !handle.trim()) {
      return NextResponse.json({ success: false, error: 'Handle is required' }, { status: 400 });
    }

    const trimmedHandle = handle.trim();

    // 1. Update user's Codeforces handle in database
    await db
      .update(users)
      .set({
        codeforcesHandle: trimmedHandle,
        codeforcesSyncStatus: 'idle',
      })
      .where(eq(users.id, session.id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
