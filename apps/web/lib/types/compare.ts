/**
 * lib/types/compare.ts
 *
 * Shared TypeScript types for the Compare feature.
 * Exported from here (not from server-only services) so they can be
 * safely imported by both server and client components.
 */

export interface GitHubStats {
  totalRepos: number;
  totalStars: number;
  followers: number;
  following: number;
  totalCommits: number;
  contributionStreak: number;
  topLanguages: { language: string; percentage: number; count: number }[];
}

export interface CodeforcesStats {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  solvedCount: number;
  contestCount: number;
  ratingHistory: {
    contestId: number;
    contestName: string;
    newRating: number;
    ratingChange: number;
    ratedAt: string;
  }[];
  tagFrequency: Record<string, number>;
  difficultyDistribution: { difficulty: string; count: number }[];
}

export interface SkillData {
  name: string;
  level: number;
  category: string;
}

export type CfLinkStatus = 'linked' | 'not_linked' | 'unknown';

export interface CompareProfile {
  /** GitHub username */
  login: string;
  displayName: string | null;
  avatarUrl: string;
  htmlUrl: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  /** Whether this user has a full Bamblu account */
  isBambluUser: boolean;
  github: GitHubStats;
  codeforces: CodeforcesStats | null;
  cfLinkStatus: CfLinkStatus;
  cfLinkConfidence: number;
  skills: SkillData[];
}
