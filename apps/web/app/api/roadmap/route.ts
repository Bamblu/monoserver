export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUser as auth } from '@/lib/user';
import { GenerateRoadmapSchema } from '@bamblu/validations';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = GenerateRoadmapSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { targetRole, targetCompanies, timeframeWeeks } = parsed.data;

  // TODO: Wire in skillService.getSkillGaps() + LLM/rule-based roadmap generation
  // Returning a stub roadmap for now
  const stub = {
    id: crypto.randomUUID(),
    userId: session.id,
    title: `${targetRole} Roadmap`,
    targetRole,
    targetCompanies,
    timeframeWeeks,
    completionPercent: 0,
    steps: [
      {
        id: crypto.randomUUID(),
        order: 1,
        title: 'Arrays & Hashing',
        description: 'Master fundamental array manipulation and hash map patterns.',
        estimatedHours: 20,
        resourceUrls: ['https://neetcode.io/roadmap'],
        status: 'not_started',
        completedAt: null,
      },
      {
        id: crypto.randomUUID(),
        order: 2,
        title: 'Two Pointers & Sliding Window',
        description: 'Linear-time techniques for contiguous subarray problems.',
        estimatedHours: 15,
        resourceUrls: ['https://neetcode.io/roadmap'],
        status: 'not_started',
        completedAt: null,
      },
    ],
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ success: true, data: stub });
}
