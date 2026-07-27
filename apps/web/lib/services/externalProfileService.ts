/**
 * lib/services/externalProfileService.ts
 *
 * Orchestrates fetching, caching, and resolving external GitHub profiles
 * for the Compare feature. Profiles are cached in gh_profile_cache table
 * and NOT treated as authenticated Bamblu users.
 *
 * Architecture:
 *  1. Check Redis (fast, in-memory) 
 *  2. Check DB cache (gh_profile_cache)
 *  3. Fetch from GitHub API
 *  4. Attempt Codeforces linking
 *  5. Persist to DB cache
 *  6. Store in Redis
 */

import { db } from '@/lib/db';
import { ghProfileCache, users, githubConnections, githubStats, codeforcesStats, skills } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { getCache, setCache, cacheKeys, TTL } from '@/lib/redis';
import {
  getGitHubUserProfile,
  getGitHubUserRepos,
  aggregateRepoLanguages,
  GitHubNotFoundError,
  type GitHubUserProfile,
  type GitHubRepo,
} from './githubSearchService';
import { attemptCFLink } from './codeforcesLinkService';
import {
  getCFUser,
  getCFSubmissions,
  getCFRatingHistory,
  getUniqueSolvedProblems,
  groupByDifficulty,
  getTagFrequency,
} from '@/lib/integrations/codeforces';

// ─── Types (re-exported from shared types module) ─────────────────────────────

export type {
  GitHubStats,
  CodeforcesStats,
  SkillData,
  CompareProfile,
  CfLinkStatus,
} from '@/lib/types/compare';

import type { GitHubStats, CodeforcesStats, SkillData, CompareProfile } from '@/lib/types/compare';

// ─── Cache TTLs ───────────────────────────────────────────────────────────────

const CACHE_TTL_MINUTES = 30;
const PROFILE_EXPIRY_HOURS = 2; // DB cache row expiry

// ─── Bamblu User Fast Path ────────────────────────────────────────────────────

async function resolveBambluUser(username: string): Promise<CompareProfile | null> {
  const connection = await db.query.githubConnections.findFirst({
    where: eq(githubConnections.username, username),
    columns: { userId: true },
  });

  if (!connection) return null;

  const [user, ghStatsRow, cfStatsRow, userSkills, ghProfile, repos] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, connection.userId),
    }),
    db.query.githubStats.findFirst({
      where: eq(githubStats.userId, connection.userId),
    }),
    db.query.codeforcesStats.findFirst({
      where: eq(codeforcesStats.userId, connection.userId),
    }),
    db.query.skills.findMany({
      where: eq(skills.userId, connection.userId),
    }),
    getGitHubUserProfile(username).catch(() => null),
    getGitHubUserRepos(username).catch(() => []),
  ]);

  if (!user) return null;

  const ghLiveStats = ghProfile ? computeGitHubStats(ghProfile, repos) : null;

  // Combine DB metrics (commits, streak) with live GitHub API metrics (repos, stars, followers, languages)
  const ghStats: GitHubStats = {
    totalRepos: ghProfile?.public_repos ?? ghStatsRow?.totalRepos ?? repos.length,
    totalStars: ghLiveStats?.totalStars ?? ghStatsRow?.totalStars ?? 0,
    followers: ghProfile?.followers ?? 0,
    following: ghProfile?.following ?? 0,
    totalCommits: ghStatsRow?.totalCommits ?? ghLiveStats?.totalCommits ?? 0,
    contributionStreak: ghStatsRow?.contributionStreak ?? 0,
    topLanguages: (ghLiveStats?.topLanguages && ghLiveStats.topLanguages.length > 0)
      ? ghLiveStats.topLanguages
      : (ghStatsRow?.topLanguages ?? []).map((l) => ({
          language: l.language,
          percentage: l.percentage,
          count: Math.round(l.linesOfCode / 1500),
        })),
  };

  const cfStats: CodeforcesStats | null = cfStatsRow
    ? {
        handle: cfStatsRow.handle,
        rating: cfStatsRow.rating,
        maxRating: cfStatsRow.maxRating,
        rank: cfStatsRow.rank ?? 'unrated',
        maxRank: cfStatsRow.maxRank ?? 'unrated',
        solvedCount: cfStatsRow.solvedCount,
        contestCount: cfStatsRow.contestCount,
        ratingHistory: (cfStatsRow.ratingHistory ?? []).slice(-20),
        tagFrequency: {},
        difficultyDistribution: [],
      }
    : null;

  return {
    login: username,
    displayName: user.name ?? ghProfile?.name ?? null,
    avatarUrl: ghProfile?.avatar_url ?? user.image ?? `https://avatars.githubusercontent.com/${username}`,
    htmlUrl: ghProfile?.html_url ?? `https://github.com/${username}`,
    bio: ghProfile?.bio ?? null,
    location: ghProfile?.location ?? null,
    website: ghProfile?.blog ?? null,
    isBambluUser: true,
    github: ghStats,
    codeforces: cfStats,
    cfLinkStatus: cfStatsRow ? 'linked' : 'not_linked',
    cfLinkConfidence: cfStatsRow ? 100 : 0,
    skills: userSkills.map((s) => ({ name: s.name, level: s.level, category: s.category })),
  };
}

// ─── DB Cache Check ───────────────────────────────────────────────────────────

async function getCachedProfile(username: string): Promise<CompareProfile | null> {
  try {
    const row = await db.query.ghProfileCache.findFirst({
      where: and(
        eq(ghProfileCache.githubUsername, username.toLowerCase()),
        gt(ghProfileCache.expiresAt, new Date())
      ),
    });

    if (!row?.profileData) return null;

    return row.profileData as unknown as CompareProfile;
  } catch {
    return null;
  }
}

// ─── DB Cache Write ───────────────────────────────────────────────────────────

async function persistToDbCache(username: string, profile: CompareProfile, cfHandle: string | null, confidence: number, cfStatus: 'linked' | 'not_linked' | 'unknown', ghProfile: GitHubUserProfile): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + PROFILE_EXPIRY_HOURS * 60 * 60 * 1000);

    await db
      .insert(ghProfileCache)
      .values({
        githubUsername: username.toLowerCase(),
        githubUserId: ghProfile.id.toString(),
        displayName: ghProfile.name,
        avatarUrl: ghProfile.avatar_url,
        bio: ghProfile.bio,
        location: ghProfile.location,
        website: ghProfile.blog,
        publicEmail: ghProfile.email,
        followers: ghProfile.followers,
        following: ghProfile.following,
        publicRepos: ghProfile.public_repos,
        profileData: profile as unknown as Record<string, unknown>,
        cfHandle,
        cfLinkConfidence: confidence,
        cfLinkStatus: cfStatus,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [ghProfileCache.githubUsername],
        set: {
          displayName: ghProfile.name,
          avatarUrl: ghProfile.avatar_url,
          bio: ghProfile.bio,
          profileData: profile as unknown as Record<string, unknown>,
          cfHandle,
          cfLinkConfidence: confidence,
          cfLinkStatus: cfStatus,
          cachedAt: new Date(),
          expiresAt,
        },
      });
  } catch (err) {
    console.warn('[externalProfileService] DB cache write failed:', err);
  }
}

// ─── CF Stats Fetcher ─────────────────────────────────────────────────────────

async function fetchCFStats(handle: string): Promise<CodeforcesStats | null> {
  try {
    const [cfUser, submissions, history] = await Promise.all([
      getCFUser(handle),
      getCFSubmissions(handle, 300),
      getCFRatingHistory(handle),
    ]);

    const solvedCount = getUniqueSolvedProblems(submissions).size;
    const tagFreq = getTagFrequency(submissions);
    const diffDist = groupByDifficulty(submissions);

    return {
      handle: cfUser.handle,
      rating: cfUser.rating ?? 0,
      maxRating: cfUser.maxRating ?? 0,
      rank: cfUser.rank ?? 'unrated',
      maxRank: cfUser.maxRank ?? 'unrated',
      solvedCount,
      contestCount: history.length,
      ratingHistory: history.slice(-20).map((h) => ({
        contestId: h.contestId,
        contestName: h.contestName,
        newRating: h.newRating,
        ratingChange: h.newRating - h.oldRating,
        ratedAt: new Date(h.ratingUpdateTimeSeconds * 1000).toISOString(),
      })),
      tagFrequency: tagFreq,
      difficultyDistribution: diffDist,
    };
  } catch (err) {
    console.warn(`[externalProfileService] CF stats fetch failed for ${handle}:`, err);
    return null;
  }
}

// ─── GH Stats Compute ─────────────────────────────────────────────────────────

function computeGitHubStats(ghProfile: GitHubUserProfile, repos: GitHubRepo[]): GitHubStats {
  const totalStars = repos.reduce((acc, r) => acc + r.stargazers_count, 0);
  const topLanguages = aggregateRepoLanguages(repos);

  // Estimate commits from repo activity (real contributions require OAuth)
  const estimatedCommits = repos.reduce(
    (acc, r) => acc + Math.min(r.stargazers_count * 2 + 10, 500),
    0
  );

  return {
    totalRepos: ghProfile.public_repos,
    totalStars,
    followers: ghProfile.followers,
    following: ghProfile.following,
    totalCommits: estimatedCommits,
    contributionStreak: 0, // Requires authenticated API
    topLanguages,
  };
}

// ─── Main Resolver ────────────────────────────────────────────────────────────

/**
 * Resolves a GitHub username to a full CompareProfile.
 *
 * Priority:
 *  1. Redis cache (fastest)
 *  2. Bamblu DB (if user is registered)
 *  3. DB profile cache (recently fetched)
 *  4. GitHub API + CF linking (cold path)
 */
export async function resolveCompareProfile(username: string): Promise<CompareProfile> {
  const normalizedUsername = username.trim();

  // 1. Redis cache
  const redisKey = cacheKeys.compareResult(normalizedUsername);
  const redisCached = await getCache<CompareProfile>(redisKey);
  if (redisCached) return redisCached;

  // 2. Bamblu DB user fast path
  const bambluProfile = await resolveBambluUser(normalizedUsername);
  if (bambluProfile) {
    await setCache(redisKey, bambluProfile, TTL.MEDIUM);
    return bambluProfile;
  }

  // 3. DB profile cache
  const dbCached = await getCachedProfile(normalizedUsername);
  if (dbCached) {
    await setCache(redisKey, dbCached, TTL.SHORT);
    return dbCached;
  }

  // 4. Cold path — fetch from GitHub
  const ghProfile = await getGitHubUserProfile(normalizedUsername);
  const repos = await getGitHubUserRepos(normalizedUsername);

  // Attempt CF linking (runs concurrently)
  const cfLinkResult = await attemptCFLink(ghProfile);

  // Fetch CF stats if linked
  let cfStats: CodeforcesStats | null = null;
  if (cfLinkResult.status === 'linked' && cfLinkResult.handle) {
    cfStats = await fetchCFStats(cfLinkResult.handle);
  }

  const githubStatsData = computeGitHubStats(ghProfile, repos);

  // Build skills from CF tags + GH languages
  const skills: SkillData[] = [];
  if (cfLinkResult.cfUser && cfStats) {
    const tagMappings: [string, string][] = [
      ['dp', 'DP'],
      ['graphs', 'Graphs'],
      ['greedy', 'Greedy'],
      ['binary search', 'Binary Search'],
      ['math', 'Maths'],
      ['strings', 'Strings'],
    ];
    for (const [tag, label] of tagMappings) {
      const count = cfStats.tagFrequency[tag] ?? 0;
      skills.push({ name: label, level: Math.min(100, count * 5 + 45), category: 'Algorithms' });
    }
  }
  for (const lang of githubStatsData.topLanguages.slice(0, 3)) {
    skills.push({
      name: lang.language,
      level: Math.round(lang.percentage * 0.4 + 55),
      category: 'Languages',
    });
  }

  const profile: CompareProfile = {
    login: ghProfile.login,
    displayName: ghProfile.name,
    avatarUrl: ghProfile.avatar_url,
    htmlUrl: ghProfile.html_url,
    bio: ghProfile.bio,
    location: ghProfile.location,
    website: ghProfile.blog,
    isBambluUser: false,
    github: githubStatsData,
    codeforces: cfStats,
    cfLinkStatus: cfLinkResult.status,
    cfLinkConfidence: cfLinkResult.confidence,
    skills,
  };

  // Persist to caches
  await Promise.all([
    setCache(redisKey, profile, TTL.MEDIUM),
    persistToDbCache(
      normalizedUsername,
      profile,
      cfLinkResult.handle,
      cfLinkResult.confidence,
      cfLinkResult.status,
      ghProfile
    ),
  ]);

  return profile;
}
