import { cookies } from 'next/headers';

export async function getUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;

  try {
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://monoserver-nmp0.onrender.com/api';
    // Defensively ensure /api suffix if the env var was set to the root domain
    if (!baseUrl.endsWith('/api') && !baseUrl.includes('localhost')) {
      baseUrl = `${baseUrl.replace(/\/$/, '')}/api`;
    }

    const endpoint = `${baseUrl}/auth/me`;
    
    const res = await fetch(endpoint, {
      headers: {
        Cookie: `auth_token=${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('[getUser] Backend returned error:', res.status, res.statusText, 'Endpoint:', endpoint);
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('[getUser] Fetch threw an error:', error);
    return null;
  }
}
