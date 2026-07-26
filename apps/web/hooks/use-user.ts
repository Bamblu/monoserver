import { useQuery } from '@tanstack/react-query';

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  githubConnections?: {
    id: string;
    username: string;
    connectedAt: string;
  }[];
}

async function fetchUser(): Promise<UserProfile | null> {
  // Fetch from the same-origin Next.js proxy route (/api/auth/me)
  // which internally forwards the cookie to NestJS server-side.
  // This avoids cross-origin CORS + cookie issues (port 3000 → 3001).
  const res = await fetch('/api/auth/me');
  if (!res.ok) {
    if (res.status === 401) {
      return null;
    }
    throw new Error('Failed to fetch user');
  }
  return res.json();
}

export function useUser() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: fetchUser,
    retry: false,
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}
