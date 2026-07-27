/**
 * lib/services/codeforcesLinkService.ts
 *
 * Heuristic Codeforces-to-GitHub linking for the Compare feature.
 *
 * Confidence scoring (0–100):
 *  - Username exact match (GH login === CF handle): +40
 *  - Username similarity ≥ 0.75 (Jaro-Winkler): +20
 *  - Display name similarity ≥ 0.75: +15
 *  - GitHub bio/website mentions CF username: +25
 *  - Existing Bamblu mapping found: +50
 *
 * Threshold: confidence >= 50 → auto-link, otherwise 'not_linked' or 'unknown'
 *
 * NOTE: Codeforces API does NOT expose email addresses publicly.
 * Email matching is only possible when both accounts belong to a Bamblu user.
 */

import { getCFUser, type CFUser } from '@/lib/integrations/codeforces';
import { db } from '@/lib/db';
import { users, githubConnections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { GitHubUserProfile } from './githubSearchService';

// ─── Constants ────────────────────────────────────────────────────────────────

const CONFIDENCE_THRESHOLD = 50;

export type CfLinkStatus = 'linked' | 'not_linked' | 'unknown';

export interface CfLinkResult {
  handle: string | null;
  confidence: number;
  status: CfLinkStatus;
  cfUser: CFUser | null;
}

// ─── Jaro-Winkler Similarity ──────────────────────────────────────────────────

function jaroWinkler(s1: string, s2: string): number {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  const matchDist = Math.max(Math.floor(Math.max(s1.length, s2.length) / 2) - 1, 0);
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDist);
    const end = Math.min(i + matchDist + 1, s2.length);
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;

  // Winkler prefix boost (up to 4 chars)
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(s1.length, s2.length)); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

// ─── Bio / Website Parsing ────────────────────────────────────────────────────

const CF_URL_PATTERNS = [
  /codeforces\.com\/profile\/([a-zA-Z0-9._-]+)/,
  /codeforces\.com\/([a-zA-Z0-9._-]+)/,
];

function extractCFHandleFromText(text: string | null | undefined): string | null {
  if (!text) return null;
  for (const pattern of CF_URL_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1] && match[1].length >= 3) return match[1];
  }
  return null;
}

// ─── Existing Bamblu Mapping Check ───────────────────────────────────────────

async function findBambluMapping(githubLogin: string): Promise<string | null> {
  try {
    const connection = await db.query.githubConnections.findFirst({
      where: eq(githubConnections.username, githubLogin),
      columns: { userId: true },
    });
    if (!connection) return null;

    const user = await db.query.users.findFirst({
      where: eq(users.id, connection.userId),
      columns: { codeforcesHandle: true },
    });
    return user?.codeforcesHandle ?? null;
  } catch {
    return null;
  }
}

// ─── CF Handle Validation ─────────────────────────────────────────────────────

async function validateCFHandle(handle: string): Promise<CFUser | null> {
  try {
    return await getCFUser(handle);
  } catch {
    return null;
  }
}

// ─── Main Linking Function ────────────────────────────────────────────────────

/**
 * Attempts to find a Codeforces account matching the given GitHub profile.
 * Returns confidence score and linked handle if found.
 */
export async function attemptCFLink(
  githubProfile: GitHubUserProfile
): Promise<CfLinkResult> {
  const { login, name, bio, blog } = githubProfile;
  let bestHandle: string | null = null;
  let bestConfidence = 0;
  let bestCFUser: CFUser | null = null;

  // ── Strategy 1: Check existing Bamblu mapping ──────────────────────────────
  const bamblluHandle = await findBambluMapping(login);
  if (bamblluHandle) {
    const cfUser = await validateCFHandle(bamblluHandle);
    if (cfUser) {
      return {
        handle: bamblluHandle,
        confidence: 90,
        status: 'linked',
        cfUser,
      };
    }
  }

  // ── Strategy 2: Extract from bio / website ─────────────────────────────────
  const bioHandle = extractCFHandleFromText(bio) || extractCFHandleFromText(blog);
  if (bioHandle) {
    const cfUser = await validateCFHandle(bioHandle);
    if (cfUser) {
      let confidence = 60; // base from bio parsing

      // Additional similarity boost
      const loginSim = jaroWinkler(login, cfUser.handle);
      if (loginSim >= 0.9) confidence += 20;
      else if (loginSim >= 0.75) confidence += 10;

      if (confidence > bestConfidence) {
        bestHandle = cfUser.handle;
        bestConfidence = confidence;
        bestCFUser = cfUser;
      }
    }
  }

  // ── Strategy 3: Username exact match ──────────────────────────────────────
  {
    const cfUser = await validateCFHandle(login);
    if (cfUser) {
      let confidence = 40; // base: username matches exactly

      // Display name similarity boost
      if (name && cfUser.handle) {
        const nameSim = jaroWinkler(name, cfUser.handle);
        if (nameSim >= 0.85) confidence += 15;
      }

      if (confidence > bestConfidence) {
        bestHandle = cfUser.handle;
        bestConfidence = confidence;
        bestCFUser = cfUser;
      }
    }
  }

  // ── Strategy 4: High-similarity username variants ─────────────────────────
  // Only if no exact match found and login is long enough
  if (!bestHandle && login.length >= 4) {
    // Try common name variants (login without numbers/underscores)
    const cleanLogin = login.replace(/[_.-]\d+$/, '').replace(/\d+$/, '');
    if (cleanLogin !== login && cleanLogin.length >= 3) {
      const cfUser = await validateCFHandle(cleanLogin);
      if (cfUser) {
        const sim = jaroWinkler(login, cfUser.handle);
        if (sim >= 0.8) {
          const confidence = Math.round(sim * 25); // max 25 for variant match
          if (confidence > bestConfidence) {
            bestHandle = cfUser.handle;
            bestConfidence = confidence;
            bestCFUser = cfUser;
          }
        }
      }
    }
  }

  // ── Determine status ──────────────────────────────────────────────────────
  if (bestHandle && bestConfidence >= CONFIDENCE_THRESHOLD) {
    return {
      handle: bestHandle,
      confidence: bestConfidence,
      status: 'linked',
      cfUser: bestCFUser,
    };
  }

  // Had some signal but not confident enough
  if (bestConfidence > 0 && bestConfidence < CONFIDENCE_THRESHOLD) {
    return { handle: null, confidence: bestConfidence, status: 'unknown', cfUser: null };
  }

  return { handle: null, confidence: 0, status: 'not_linked', cfUser: null };
}
