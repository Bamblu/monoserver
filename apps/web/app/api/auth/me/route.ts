export const dynamic = 'force-dynamic';

import { getUser } from '@/lib/user';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/me
 *
 * Next.js-side proxy for the NestJS /api/auth/me endpoint.
 * The client-side useUser() hook fetches this same-origin route
 * instead of hitting NestJS directly (which requires cross-origin
 * cookie forwarding and CORS preflight — unreliable in dev).
 *
 * This handler reads the auth_token cookie server-side via getUser(),
 * which already works correctly, and returns the user JSON.
 */
export async function GET() {
  const user = await getUser();

  if (!user) {
    return NextResponse.json(null, { status: 401 });
  }

  return NextResponse.json(user);
}
