export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';

export const runtime = 'nodejs';

/**
 * POST /api/onboarding/validate-cf
 *
 * Server-side Codeforces handle validation.
 * Uses the Codeforces API key/secret from env to make authenticated requests.
 * This avoids CORS issues (CF API blocks browser CORS) and keeps credentials secure.
 *
 * Codeforces API authentication:
 *  1. rand = random 6-char string
 *  2. Build: `rand/METHOD?apiKey=KEY&param=val&time=TIME#SECRET`
 *  3. apiSig = rand + SHA512(above string)
 *  4. Append &apiSig=<apiSig> to the request URL
 */

const CF_API_BASE = 'https://codeforces.com/api';

function buildSignedCfUrl(method: string, params: Record<string, string>): string {
  const apiKey = process.env.CODEFORCES_API_KEY!;
  const apiSecret = process.env.CODEFORCES_API_SECRET!;
  const time = Math.floor(Date.now() / 1000).toString();
  const rand = randomBytes(3).toString('hex'); // 6 hex chars

  // Sort params alphabetically for consistent signature
  const allParams: Record<string, string> = {
    ...params,
    apiKey,
    time,
  };

  const sortedParamStr = Object.keys(allParams)
    .sort()
    .map((k) => `${k}=${allParams[k]}`)
    .join('&');

  // String to hash: rand/method?sortedParams#secret
  const toHash = `${rand}/${method}?${sortedParamStr}#${apiSecret}`;
  const hash = createHash('sha512').update(toHash).digest('hex');
  const apiSig = `${rand}${hash}`;

  return `${CF_API_BASE}/${method}?${sortedParamStr}&apiSig=${apiSig}`;
}

interface CFUserResult {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  titlePhoto?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const handle = (body.handle ?? '').trim();

    if (!handle) {
      return NextResponse.json(
        { success: false, error: 'Handle is required' },
        { status: 400 }
      );
    }

    // Validate handle format (CF allows letters, digits, underscores, hyphens, 3–24 chars)
    if (!/^[a-zA-Z0-9_\-\.]{3,24}$/.test(handle)) {
      return NextResponse.json(
        { success: false, error: 'Invalid handle format' },
        { status: 400 }
      );
    }

    const apiKey = process.env.CODEFORCES_API_KEY;
    const apiSecret = process.env.CODEFORCES_API_SECRET;

    let url: string;
    if (apiKey && apiSecret) {
      // Use signed API request (authenticated — higher rate limits)
      url = buildSignedCfUrl('user.info', { handles: handle });
    } else {
      // Fall back to public API (60 req/min unauthenticated)
      url = `${CF_API_BASE}/user.info?handles=${encodeURIComponent(handle)}`;
    }

    const cfRes = await fetch(url, {
      headers: { 'User-Agent': 'Bamblu/1.0' },
      next: { revalidate: 0 }, // no cache — live validation
    });

    if (!cfRes.ok) {
      if (cfRes.status === 400) {
        // CF returns 400 when handle is not found
        return NextResponse.json({ success: false, found: false });
      }
      throw new Error(`Codeforces API responded with ${cfRes.status}`);
    }

    const data = await cfRes.json();

    if (data.status !== 'OK' || !data.result?.[0]) {
      return NextResponse.json({ success: false, found: false });
    }

    const cfUser = data.result[0] as CFUserResult;

    return NextResponse.json({
      success: true,
      found: true,
      data: {
        handle: cfUser.handle,
        rating: cfUser.rating ?? 0,
        maxRating: cfUser.maxRating ?? 0,
        rank: cfUser.rank ?? 'unrated',
        maxRank: cfUser.maxRank ?? 'unrated',
      },
    });
  } catch (error: any) {
    console.error('[validate-cf] error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Validation service unavailable. Please try again.' },
      { status: 503 }
    );
  }
}
