import { NextRequest, NextResponse } from 'next/server';
import { getUser as auth } from '@/lib/user';
import { SyncRequestSchema } from '@bamblu/validations';
import { acquireLock, releaseLock, cacheKeys, deleteCache } from '@/lib/redis';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { integrationService } from '@/services/integrationService';

export const runtime = 'nodejs';
export const maxDuration = 60; // seconds — Vercel Pro limit

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = SyncRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { sources, force } = parsed.data;
  const userId = session.id;

  const results: Record<string, string> = {};

  for (const source of sources) {
    const lockKey = cacheKeys.syncLock(userId, source);
    const acquired = await acquireLock(lockKey, 120);

    if (!acquired && !force) {
      results[source] = 'already_syncing';
      continue;
    }

    try {
      // Mark sync as in-progress
      await db
        .update(users)
        .set({
          [`${source}SyncStatus`]: 'syncing',
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Trigger actual sync via integrationService
      await integrationService.sync(userId, source);

      // Invalidate cached stats
      await deleteCache(cacheKeys.userStats(userId));
      await deleteCache(cacheKeys.userSkills(userId));

      await db
        .update(users)
        .set({
          [`${source}SyncStatus`]: 'success',
          [`${source}LastSyncedAt`]: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      results[source] = 'ok';
    } catch (err) {
      await db
        .update(users)
        .set({ [`${source}SyncStatus`]: 'error', updatedAt: new Date() })
        .where(eq(users.id, userId));
      results[source] = 'error';
      console.error(`[sync] ${source} sync failed for ${userId}:`, err);
    } finally {
      await releaseLock(lockKey);
    }
  }

  return NextResponse.json({ success: true, data: results });
}
