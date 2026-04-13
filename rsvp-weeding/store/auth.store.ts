import { create } from 'zustand';
import { authApi } from '../lib/endpoints';

// Singleton promise — ensures refresh only fires once even if called from multiple components
let sessionLoadPromise: Promise<void> | null = null;

function runLoadSession(get: () => AuthState, set: (s: Partial<AuthState>) => void): Promise<void> {
  if (sessionLoadPromise) return sessionLoadPromise;

  sessionLoadPromise = (async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      localStorage.removeItem('access_token');
      return;
    }

    if (get().accessToken) return;

    const stored = localStorage.getItem('access_token');
    if (stored) set({ accessToken: stored });

    try {
      const res = await authApi.refresh(refresh);
      const newAccess = res.data.access;
      if (res.data.refresh) localStorage.setItem('refresh_token', res.data.refresh);
      localStorage.setItem('access_token', newAccess);
      set({ accessToken: newAccess });
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, accessToken: null });
    }
  })();

  return sessionLoadPromise;
}

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;

  // Load saved session from localStorage on app boot
  loadSession: () => Promise<void>;

  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: false,

  loadSession: () => runLoadSession(get, set),

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login(username, password);
      const { access, refresh } = res.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      set({ accessToken: access, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      try { await authApi.logout(refresh); } catch { /* ignore */ }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, accessToken: null });
  },
}));
