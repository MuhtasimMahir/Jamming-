import type { SpotifyTrack } from '@/types';
import { loadJSON, saveJSON, removeKey, STORAGE_KEYS } from './storage';

/**
 * Spotify sunset the implicit grant flow on Nov 27 2025, so this uses
 * Authorization Code + PKCE — the flow Spotify recommends for browser apps
 * that can't keep a client secret. Everything here runs client-side; the
 * "secret" in PKCE is a one-time verifier generated per login attempt.
 *
 * Playback is preview-only and read from `preview_url` when Spotify
 * provides one. Spotify's Widget/Developer Terms explicitly forbid apps
 * from letting users download or save Spotify content ("must not allow
 * users to rip any songs"), so there is intentionally no download path
 * for Spotify-sourced audio anywhere in this app — only for the user's
 * own uploaded files. See the Local Library instead.
 */

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string | undefined;
const SCOPES = 'playlist-modify-public playlist-modify-private user-read-private';
const AUTHORIZE_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';

interface SpotifyAuthState {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class SpotifyAuthError extends Error {
  constructor(message = 'Your Spotify session expired. Reconnect to continue.') {
    super(message);
    this.name = 'SpotifyAuthError';
  }
}

export function isSpotifyConfigured(): boolean {
  return Boolean(CLIENT_ID && REDIRECT_URI);
}

// ---------------------------------------------------------------------------
// PKCE helpers
// ---------------------------------------------------------------------------

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomValues, (v) => chars[v % chars.length]).join('');
}

async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ---------------------------------------------------------------------------
// Auth state
// ---------------------------------------------------------------------------

function readAuthState(): SpotifyAuthState | null {
  return loadJSON<SpotifyAuthState | null>(STORAGE_KEYS.spotifyAuth, null);
}

function writeAuthState(state: SpotifyAuthState | null): void {
  if (state) saveJSON(STORAGE_KEYS.spotifyAuth, state);
  else removeKey(STORAGE_KEYS.spotifyAuth);
}

export function isLoggedIn(): boolean {
  return readAuthState() !== null;
}

export function logout(): void {
  writeAuthState(null);
}

/** Redirects the browser to Spotify's consent screen. */
export async function startLogin(): Promise<void> {
  if (!CLIENT_ID || !REDIRECT_URI) {
    throw new Error('Spotify is not configured. Set VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_REDIRECT_URI.');
  }
  const verifier = generateRandomString(64);
  const challenge = await sha256Base64Url(verifier);
  const state = generateRandomString(16);
  saveJSON(STORAGE_KEYS.pkceVerifier, { verifier, state });

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SCOPES,
    state,
  });
  window.location.href = `${AUTHORIZE_ENDPOINT}?${params.toString()}`;
}

/**
 * Call on the /callback route. Exchanges the ?code= for tokens.
 * Returns true on success, false if there was nothing to handle.
 * Throws if Spotify returned an error or the exchange failed.
 */
export async function handleAuthCallback(): Promise<boolean> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) throw new Error(`Spotify sign-in was cancelled (${error}).`);
  if (!code) return false;

  const stored = loadJSON<{ verifier: string; state: string } | null>(STORAGE_KEYS.pkceVerifier, null);
  if (!stored || stored.state !== returnedState) {
    throw new Error('Sign-in could not be verified. Please try again.');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI ?? '',
    client_id: CLIENT_ID ?? '',
    code_verifier: stored.verifier,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error('Could not complete Spotify sign-in.');
  const json = await res.json();

  writeAuthState({
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000 - 60_000,
  });
  removeKey(STORAGE_KEYS.pkceVerifier);
  window.history.replaceState({}, '', window.location.pathname);
  return true;
}

async function refreshAccessToken(state: SpotifyAuthState): Promise<SpotifyAuthState> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: state.refreshToken,
    client_id: CLIENT_ID ?? '',
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    writeAuthState(null);
    throw new SpotifyAuthError();
  }
  const json = await res.json();
  const next: SpotifyAuthState = {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? state.refreshToken,
    expiresAt: Date.now() + json.expires_in * 1000 - 60_000,
  };
  writeAuthState(next);
  return next;
}

async function getValidAccessToken(): Promise<string | null> {
  let state = readAuthState();
  if (!state) return null;
  if (Date.now() >= state.expiresAt) {
    state = await refreshAccessToken(state);
  }
  return state.accessToken;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

async function spotifyFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getValidAccessToken();
  if (!token) throw new SpotifyAuthError('Connect Spotify to search and save playlists.');
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new SpotifyAuthError();
  return res;
}

function mapTrack(raw: any): SpotifyTrack {
  const images: Array<{ url: string }> = raw.album?.images ?? [];
  return {
    id: `spotify:${raw.id}`,
    source: 'spotify',
    spotifyId: raw.id,
    name: raw.name,
    artist: (raw.artists ?? []).map((a: any) => a.name).join(', '),
    album: raw.album?.name ?? '',
    durationMs: raw.duration_ms ?? null,
    artworkUrl: images[0]?.url ?? null,
    externalUrl: raw.external_urls?.spotify ?? null,
    previewUrl: raw.preview_url ?? null,
    uri: raw.uri,
    addedAt: Date.now(),
  };
}

export async function searchTracks(term: string): Promise<SpotifyTrack[]> {
  if (!term.trim()) return [];
  const res = await spotifyFetch(`/search?type=track&limit=24&q=${encodeURIComponent(term)}`);
  if (!res.ok) throw new Error('Spotify search failed. Try again in a moment.');
  const json = await res.json();
  const items = json.tracks?.items ?? [];
  return items.map(mapTrack);
}

export interface SpotifyProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export async function getCurrentUser(): Promise<SpotifyProfile | null> {
  try {
    const res = await spotifyFetch('/me');
    if (!res.ok) return null;
    const json = await res.json();
    const images: Array<{ url: string }> = json.images ?? [];
    return { id: json.id, displayName: json.display_name ?? json.id, avatarUrl: images[0]?.url ?? null };
  } catch {
    return null;
  }
}

export async function savePlaylistToSpotify(
  name: string,
  description: string,
  trackUris: string[],
): Promise<{ url: string | null }> {
  const meRes = await spotifyFetch('/me');
  if (!meRes.ok) throw new Error('Could not read your Spotify profile.');
  const me = await meRes.json();

  const createRes = await spotifyFetch(`/users/${me.id}/playlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, public: false }),
  });
  if (!createRes.ok) throw new Error('Could not create the playlist on Spotify.');
  const playlist = await createRes.json();

  // Spotify caps this endpoint at 100 URIs per request.
  for (let i = 0; i < trackUris.length; i += 100) {
    const chunk = trackUris.slice(i, i + 100);
    const addRes = await spotifyFetch(`/playlists/${playlist.id}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: chunk }),
    });
    if (!addRes.ok) throw new Error('Playlist was created, but adding tracks failed partway through.');
  }

  return { url: playlist.external_urls?.spotify ?? null };
}
