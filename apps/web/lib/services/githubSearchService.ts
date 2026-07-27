/**
 * lib/services/githubSearchService.ts
 *
 * Encapsulates all GitHub API communication for the Compare feature.
 * Uses OAuth App credentials (client_id + client_secret) as Basic Auth
 * to raise unauthenticated rate limit from 60 → 5,000 req/hr.
 *
 * GitHub tokens are NEVER returned to the frontend.
 * All requests are server-side only.
 */

const GH_API = 'https://api.github.com';
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GitHubUserSuggestion {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: 'User' | 'Organization';
  score?: number;
}

export interface GitHubUserProfile {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  updated_at: string;
  topics: string[];
}

// ─── Rate Limit Error ─────────────────────────────────────────────────────────

export class GitHubRateLimitError extends Error {
  constructor(public readonly resetAt: Date) {
    super(`GitHub API rate limit exceeded. Resets at ${resetAt.toISOString()}`);
    this.name = 'GitHubRateLimitError';
  }
}

export class GitHubNotFoundError extends Error {
  constructor(username: string) {
    super(`GitHub user not found: ${username}`);
    this.name = 'GitHubNotFoundError';
  }
}

// ─── Auth Headers ─────────────────────────────────────────────────────────────

function buildGitHubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Bamblu-App/1.0',
  };

  // Use OAuth App credentials for higher rate limit (5000/hr vs 60/hr)
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (clientId && clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  return headers;
}

// ─── Core Fetch with Retry + Backoff ─────────────────────────────────────────

async function ghFetch<T>(
  path: string,
  options: { signal?: AbortSignal } = {}
): Promise<T> {
  const url = `${GH_API}${path}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      headers: buildGitHubHeaders(),
      signal: options.signal,
      next: { revalidate: 0 }, // disable ISR — we handle caching manually
    });

    if (res.ok) {
      return res.json() as Promise<T>;
    }

    // Handle rate limiting
    if (res.status === 429 || res.status === 403) {
      const resetHeader = res.headers.get('X-RateLimit-Reset');
      const resetAt = resetHeader
        ? new Date(parseInt(resetHeader, 10) * 1000)
        : new Date(Date.now() + 60_000);
      throw new GitHubRateLimitError(resetAt);
    }

    // 404 → user not found
    if (res.status === 404) {
      throw new GitHubNotFoundError(path);
    }

    // 5xx → retry with exponential backoff
    if (res.status >= 500 && attempt < MAX_RETRIES - 1) {
      const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    const body = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(`GitHub API error ${res.status}: ${body.message ?? 'Unknown error'}`);
  }

  throw new Error('GitHub API request failed after max retries');
}

// ─── Search Users ─────────────────────────────────────────────────────────────

/**
 * Search GitHub users by username prefix.
 * Uses the Search API for autocomplete-style results.
 */
export async function searchGitHubUsers(
  query: string,
  limit = 8
): Promise<GitHubUserSuggestion[]> {
  if (!query || query.trim().length < 1) return [];

  // GitHub Search API: search by login prefix
  const encoded = encodeURIComponent(`${query.trim()} in:login`);
  const data = await ghFetch<{ items: GitHubUserSuggestion[] }>(
    `/search/users?q=${encoded}&per_page=${Math.min(limit, 30)}&sort=followers&order=desc`
  );

  return (data.items ?? []).filter((u) => u.type === 'User').slice(0, limit);
}

// ─── Get User Profile ─────────────────────────────────────────────────────────

export async function getGitHubUserProfile(username: string): Promise<GitHubUserProfile> {
  return ghFetch<GitHubUserProfile>(`/users/${encodeURIComponent(username)}`);
}

// ─── Get User Repos ───────────────────────────────────────────────────────────

export async function getGitHubUserRepos(
  username: string,
  maxPages = 2
): Promise<GitHubRepo[]> {
  const pages = await Promise.all(
    Array.from({ length: maxPages }, (_, i) =>
      ghFetch<GitHubRepo[]>(
        `/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&type=owner&page=${i + 1}`
      ).catch(() => [] as GitHubRepo[])
    )
  );
  return pages.flat().filter((r) => !r.fork);
}

// ─── Get User Events ─────────────────────────────────────────────────────────

export async function getGitHubUserEvents(username: string): Promise<unknown[]> {
  return ghFetch<unknown[]>(
    `/users/${encodeURIComponent(username)}/events/public?per_page=100`
  ).catch(() => []);
}

// ─── Language Aggregation ─────────────────────────────────────────────────────

export function aggregateRepoLanguages(
  repos: GitHubRepo[]
): { language: string; count: number; percentage: number }[] {
  const counts: Record<string, number> = {};
  for (const repo of repos) {
    if (repo.language) {
      counts[repo.language] = (counts[repo.language] ?? 0) + 1;
    }
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([language, count]) => ({
      language,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
}
