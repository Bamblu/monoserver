export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUser as auth } from '@/lib/user';
import { db } from '@/lib/db';
import { githubActivity, codeforcesActivity } from '@/lib/db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { ActivityQuerySchema } from '@bamblu/validations';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const parsed = ActivityQuerySchema.safeParse({
    userId: searchParams.get('userId'),
    source: searchParams.get('source'),
    page: searchParams.get('page'),
    pageSize: searchParams.get('pageSize'),
    from: searchParams.get('from'),
    to: searchParams.get('to'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid query params', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { userId, source, page, pageSize, from, to } = parsed.data;
  const offset = (page - 1) * pageSize;

  const ghFilter = and(
    eq(githubActivity.userId, userId),
    from ? gte(githubActivity.occurredAt, from) : undefined,
    to ? lte(githubActivity.occurredAt, to) : undefined
  );

  const cfFilter = and(
    eq(codeforcesActivity.userId, userId),
    from ? gte(codeforcesActivity.occurredAt, from) : undefined,
    to ? lte(codeforcesActivity.occurredAt, to) : undefined
  );

  if (source === 'github') {
    const [items, [{ count }]] = await Promise.all([
      db.query.githubActivity.findMany({
        where: ghFilter,
        orderBy: desc(githubActivity.occurredAt),
        limit: pageSize,
        offset,
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(githubActivity).where(ghFilter),
    ]);
    return NextResponse.json({
      success: true,
      data: { items, total: count, page, pageSize, hasNextPage: offset + items.length < count },
    });
  }

  if (source === 'codeforces') {
    const [items, [{ count }]] = await Promise.all([
      db.query.codeforcesActivity.findMany({
        where: cfFilter,
        orderBy: desc(codeforcesActivity.occurredAt),
        limit: pageSize,
        offset,
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(codeforcesActivity).where(cfFilter),
    ]);
    return NextResponse.json({
      success: true,
      data: { items, total: count, page, pageSize, hasNextPage: offset + items.length < count },
    });
  }

  // source === 'all' — merge + sort by date (simplified: fetch equal splits)
  const half = Math.ceil(pageSize / 2);
  const [ghItems, cfItems] = await Promise.all([
    db.query.githubActivity.findMany({
      where: ghFilter,
      orderBy: desc(githubActivity.occurredAt),
      limit: half,
      offset,
    }),
    db.query.codeforcesActivity.findMany({
      where: cfFilter,
      orderBy: desc(codeforcesActivity.occurredAt),
      limit: half,
      offset,
    }),
  ]);

  const merged = [
    ...ghItems.map((i) => ({ ...i, _source: 'github' as const })),
    ...cfItems.map((i) => ({ ...i, _source: 'codeforces' as const })),
  ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

  return NextResponse.json({
    success: true,
    data: { items: merged, page, pageSize, hasNextPage: merged.length === pageSize },
  });
}
