export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Vercel Cron Job — triggered by vercel.json schedule.
 * Syncs GitHub + Codeforces activity for all active users.
 *
 * Add to vercel.json:
 * {
 *   "crons": [{ "path": "/api/jobs/sync-activity", "schedule": "0 * * * *" }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify the request comes from Vercel Cron (or our own scheduler)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Fetch all users with connected integrations and trigger sync
  // const activeUsers = await db.query.users.findMany({
  //   where: or(isNotNull(users.githubHandle), isNotNull(users.codeforcesHandle)),
  // });
  // await Promise.allSettled(activeUsers.map((u) => integrationService.sync(u.id)));

  return NextResponse.json({
    success: true,
    data: { message: 'Cron triggered — sync queued for all active users', ts: new Date().toISOString() },
  });
}
