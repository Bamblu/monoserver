import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, githubStats, codeforcesStats, githubConnections } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getCache, setCache, cacheKeys, TTL } from '@/lib/redis';
import { getCFRankColor, getLanguageColor } from '@bamblu/utils';

export const runtime = 'edge';

const W = 495;
const H = 195;

const THEMES = {
  dark:   { bg: '#0d1117', border: '#30363d', text: '#e6edf3', sub: '#8b949e', accent: '#148cff' },
  light:  { bg: '#ffffff', border: '#d0d7de', text: '#1f2328', sub: '#636c76', accent: '#0969da' },
  ocean:  { bg: '#0a192f', border: '#1d3557', text: '#ccd6f6', sub: '#8892b0', accent: '#64ffda' },
  forest: { bg: '#0d1b0f', border: '#1e3a2f', text: '#d4edda', sub: '#80af8e', accent: '#00d084' },
} as const;

type Theme = keyof typeof THEMES;

function escXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  const { handle } = params;
  const { searchParams } = request.nextUrl;
  const theme = (searchParams.get('theme') ?? 'dark') as Theme;
  const colors = THEMES[theme] ?? THEMES.dark;

  const cacheKey = cacheKeys.card(handle, theme);
  const cached = await getCache<string>(cacheKey);
  if (cached) {
    return new NextResponse(cached, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' },
    });
  }

  // Cards are identified by GitHub username — look up via githubConnections table
  const ghConnection = await db.query.githubConnections.findFirst({
    where: eq(githubConnections.username, handle),
    columns: { userId: true },
  });

  const user = ghConnection
    ? await db.query.users.findFirst({
        where: eq(users.id, ghConnection.userId),
      })
    : null;

  let ghStatsRow = null;
  let cfStatsRow = null;

  if (user) {
    [ghStatsRow, cfStatsRow] = await Promise.all([
      db.query.githubStats.findFirst({
        where: eq(githubStats.userId, user.id),
        orderBy: desc(githubStats.snapshotAt),
      }),
      db.query.codeforcesStats.findFirst({
        where: eq(codeforcesStats.userId, user.id),
        orderBy: desc(codeforcesStats.snapshotAt),
      }),
    ]);
  }

  const displayName = escXml(user?.name ?? handle);
  const cfHandle = escXml(user?.codeforcesHandle ?? '—');
  const cfRating = cfStatsRow?.rating ?? 0;
  const cfRank = cfStatsRow?.rank ?? 'unrated';
  const cfColor = getCFRankColor(cfRank);
  const ghCommits = ghStatsRow?.totalCommits ?? 0;
  const ghRepos = ghStatsRow?.totalRepos ?? 0;
  const ghStreak = ghStatsRow?.contributionStreak ?? 0;
  const topLang = (ghStatsRow?.topLanguages as { language: string }[] | null)?.[0]?.language ?? '—';
  const langColor = getLanguageColor(topLang);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-label="Bamblu card for ${displayName}">
  <style>
    .title { font: 600 18px 'Segoe UI', system-ui, sans-serif; fill: ${colors.text}; }
    .sub   { font: 400 13px 'Segoe UI', system-ui, sans-serif; fill: ${colors.sub}; }
    .value { font: 700 15px 'Segoe UI', system-ui, sans-serif; fill: ${colors.text}; }
    .label { font: 400 12px 'Segoe UI', system-ui, sans-serif; fill: ${colors.sub}; }
    .accent { fill: ${colors.accent}; }
  </style>
  <rect width="${W}" height="${H}" rx="12" fill="${colors.bg}" stroke="${colors.border}" stroke-width="1.5"/>
  <rect width="4" height="${H}" rx="2" fill="${colors.accent}"/>
  <text x="24" y="38" class="title">${displayName}</text>
  <text x="24" y="58" class="sub">@${escXml(handle)} · Bamblu</text>
  <line x1="24" y1="72" x2="${W - 24}" y2="72" stroke="${colors.border}" stroke-width="1"/>
  <text x="24" y="96" class="label">GitHub</text>
  <text x="24" y="116" class="value">${ghCommits.toLocaleString()}</text>
  <text x="24" y="131" class="label">commits</text>
  <text x="110" y="116" class="value">${ghRepos}</text>
  <text x="110" y="131" class="label">repos</text>
  <text x="196" y="116" class="value">${ghStreak}d</text>
  <text x="196" y="131" class="label">streak</text>
  <circle cx="292" cy="112" r="5" fill="${langColor}"/>
  <text x="302" y="117" class="label">${escXml(topLang)}</text>
  <line x1="355" y1="80" x2="355" y2="155" stroke="${colors.border}" stroke-width="1"/>
  <text x="375" y="96" class="label">Codeforces</text>
  <text x="375" y="116" class="value" style="fill:${cfColor}">${cfRating}</text>
  <text x="375" y="131" class="label" style="fill:${cfColor}">${escXml(cfRank)}</text>
  <text x="375" y="148" class="label">@${escXml(cfHandle)}</text>
  <text x="${W - 24}" y="${H - 12}" class="label" text-anchor="end">bamblu.dev</text>
</svg>`;

  await setCache(cacheKey, svg, TTL.LONG);

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
