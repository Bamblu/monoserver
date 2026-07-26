import { create } from 'zustand';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface AppState {
  // ── UI ─────────────────────────────────────────────────────────────────────
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  activeTheme: 'system' | 'light' | 'dark';
  setTheme: (theme: 'system' | 'light' | 'dark') => void;

  // ── Sync ───────────────────────────────────────────────────────────────────
  /** Global sync status shared across dashboard components. */
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (at: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // UI
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  activeTheme: 'system',
  setTheme: (theme) => set({ activeTheme: theme }),

  // Sync
  syncStatus: 'idle',
  lastSyncedAt: null,
  setSyncStatus: (status) => set({ syncStatus: status }),
  setLastSyncedAt: (at) => set({ lastSyncedAt: at }),
}));
