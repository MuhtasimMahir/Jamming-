import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as spotify from '@/lib/spotify';
import type { SpotifyProfile } from '@/lib/spotify';

interface SpotifyAuthContextValue {
  isConfigured: boolean;
  isLoggedIn: boolean;
  profile: SpotifyProfile | null;
  isConnecting: boolean;
  login: () => Promise<void>;
  logout: () => void;
  /** Re-reads auth state from storage. Call after the OAuth callback
   * exchanges a code for tokens so the rest of the app picks it up. */
  refresh: () => void;
}

const SpotifyAuthContext = createContext<SpotifyAuthContextValue | null>(null);

export function SpotifyAuthProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(spotify.isLoggedIn());
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!loggedIn) {
      setProfile(null);
      return;
    }
    spotify.getCurrentUser().then(setProfile);
  }, [loggedIn]);

  const login = useCallback(async () => {
    setIsConnecting(true);
    try {
      await spotify.startLogin();
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const logout = useCallback(() => {
    spotify.logout();
    setLoggedIn(false);
  }, []);

  const refresh = useCallback(() => setLoggedIn(spotify.isLoggedIn()), []);

  const value = useMemo<SpotifyAuthContextValue>(
    () => ({
      isConfigured: spotify.isSpotifyConfigured(),
      isLoggedIn: loggedIn,
      profile,
      isConnecting,
      login,
      logout,
      refresh,
    }),
    [loggedIn, profile, isConnecting, login, logout, refresh],
  );

  return <SpotifyAuthContext.Provider value={value}>{children}</SpotifyAuthContext.Provider>;
}

export function useSpotifyAuth(): SpotifyAuthContextValue {
  const ctx = useContext(SpotifyAuthContext);
  if (!ctx) throw new Error('useSpotifyAuth must be used within SpotifyAuthProvider');
  return ctx;
}
