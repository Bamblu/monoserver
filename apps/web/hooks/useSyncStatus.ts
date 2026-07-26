import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface UseSyncStatusOptions {
  userId: string;
  initialStatus?: string;
}

interface UseSyncStatusReturn {
  syncStatus: SyncStatus;
  isSyncing: boolean;
  triggerSync: (sources: string[]) => Promise<void>;
  error: string | null;
}

/**
 * useSyncStatus
 *
 * Manages sync state for the dashboard.
 * - Prevents duplicate concurrent requests (ref-based guard)
 * - Invalidates TanStack Query cache on success → triggers re-fetch
 * - Handles API failures gracefully
 * - Uses the existing POST /api/sync endpoint
 */
export function useSyncStatus({
  userId,
  initialStatus = 'idle',
}: UseSyncStatusOptions): UseSyncStatusReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    (initialStatus as SyncStatus) ?? 'idle'
  );
  const [error, setError] = useState<string | null>(null);
  const isSyncingRef = useRef(false); // prevents duplicate concurrent requests
  const queryClient = useQueryClient();

  const triggerSync = useCallback(
    async (sources: string[]) => {
      // Prevent duplicate sync requests
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      setSyncStatus('syncing');
      setError(null);

      try {
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sources }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Sync failed with status ${res.status}`);
        }

        const data = await res.json();

        // Check if any individual source errored
        const hasError = Object.values(data.data ?? {}).some((v) => v === 'error');

        setSyncStatus(hasError ? 'error' : 'success');

        if (!hasError) {
          // Invalidate stats and user queries so the page auto-refreshes
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['user', 'me'] }),
            queryClient.invalidateQueries({ queryKey: ['stats', userId] }),
          ]);
        }
      } catch (err: any) {
        console.error('[useSyncStatus] sync error:', err.message);
        setError(err.message ?? 'Sync failed');
        setSyncStatus('error');
      } finally {
        isSyncingRef.current = false;
      }
    },
    [userId, queryClient]
  );

  return {
    syncStatus,
    isSyncing: syncStatus === 'syncing',
    triggerSync,
    error,
  };
}
