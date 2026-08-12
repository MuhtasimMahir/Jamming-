import { useEffect, useRef, useState } from 'react';
import { Search as SearchIcon, X, Music, WifiOff } from 'lucide-react';
import { searchTracks, SpotifyAuthError } from '@/lib/spotify';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSpotifyAuth } from '@/context/SpotifyAuthContext';
import { TrackList } from '@/components/playlist/TrackList';
import { TrackRowSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import type { SpotifyTrack } from '@/types';

export function SearchPage() {
  const { isConfigured, isLoggedIn, isConnecting, login, logout } = useSpotifyAuth();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 400);
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim() || !isLoggedIn) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    searchTracks(debouncedQuery)
      .then((tracks) => {
        if (!cancelled) setResults(tracks);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof SpotifyAuthError) {
          logout();
          setError('Your Spotify session expired. Reconnect to keep searching.');
        } else {
          setError(err instanceof Error ? err.message : 'Search failed.');
        }
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, isLoggedIn, logout]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="mb-5 font-display text-2xl font-bold text-text-primary sm:text-3xl">Search</h1>

      <div className="relative mb-6">
        <SearchIcon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs or artists on Spotify"
          className="h-12 w-full rounded-full border border-border-strong bg-surface pl-11 pr-11 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {!isConfigured ? (
        <EmptyState
          icon={<WifiOff size={22} />}
          title="Spotify isn't configured"
          description="Add VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_REDIRECT_URI to your .env file to enable search. See the README."
        />
      ) : !isLoggedIn ? (
        <EmptyState
          icon={<Music size={22} />}
          title="Connect Spotify to search"
          description="Search runs against Spotify's catalog. Connect your account to find tracks and save playlists back to Spotify."
          action={
            <Button isLoading={isConnecting} onClick={login}>
              Connect Spotify
            </Button>
          }
        />
      ) : error ? (
        <EmptyState icon={<WifiOff size={22} />} title="Something went wrong" description={error} />
      ) : isLoading ? (
        <div className="space-y-0.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <TrackRowSkeleton key={i} />
          ))}
        </div>
      ) : query.trim() && results.length === 0 ? (
        <EmptyState icon={<SearchIcon size={22} />} title="No results" description={`Nothing matched "${query}". Try a different search.`} />
      ) : results.length > 0 ? (
        <TrackList tracks={results} showAlbum />
      ) : (
        <p className="px-1 text-sm text-text-tertiary">Start typing to search Spotify's catalog.</p>
      )}
    </div>
  );
}
