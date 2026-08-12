const PREFIX = 'jammzzzlist:';

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    // Quota exceeded or storage disabled (e.g. private browsing). Non-fatal —
    // the in-memory state for this session still works, it just won't persist.
    console.warn(`Could not persist "${key}" to localStorage`, err);
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

export const STORAGE_KEYS = {
  theme: 'theme',
  playlists: 'playlists',
  localTracks: 'local-tracks',
  favorites: 'favorites',
  history: 'play-history',
  volume: 'volume',
  spotifyAuth: 'spotify-auth',
  pkceVerifier: 'spotify-pkce-verifier',
} as const;
