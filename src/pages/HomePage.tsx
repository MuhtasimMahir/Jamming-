import { useNavigate } from 'react-router-dom';
import { Music2, Search, Sparkles } from 'lucide-react';
import { useLibrary } from '@/context/LibraryContext';
import { useSpotifyAuth } from '@/context/SpotifyAuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { PlaylistCard } from '@/components/playlist/PlaylistCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { formatDuration, greetingForHour } from '@/lib/format';

export function HomePage() {
  const { playlists, likedSongs, localLibrary, recentlyPlayed } = useLibrary();
  const { profile } = useSpotifyAuth();
  const { playNow, currentTrack } = usePlayer();
  const navigate = useNavigate();

  const allPlaylists = [likedSongs, localLibrary, ...playlists];
  const isLibraryEmpty = playlists.length === 0 && likedSongs.trackIds.length === 0 && localLibrary.trackIds.length === 0;
  const greeting = greetingForHour();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
        {greeting}
        {profile?.displayName ? `, ${profile.displayName}` : ''}
      </h1>

      {recentlyPlayed.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Recently played</h2>
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
            {recentlyPlayed.slice(0, 12).map((track) => (
              <button key={track.id} onClick={() => playNow(track, recentlyPlayed)} className="w-36 shrink-0 text-left">
                <div className="relative mb-2 aspect-square overflow-hidden rounded-[var(--radius-md)] bg-surface">
                  {track.artworkUrl ? (
                    <img src={track.artworkUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-text-tertiary">
                      <Music2 size={28} />
                    </div>
                  )}
                  {currentTrack?.id === track.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-canvas/50">
                      <span className="rounded-full bg-accent-solid px-2 py-1 font-mono text-[10px] text-white">
                        {formatDuration(track.durationMs)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="truncate text-sm font-medium text-text-primary">{track.name}</p>
                <p className="truncate text-xs text-text-secondary">{track.artist}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Your library</h2>

        {isLibraryEmpty ? (
          <EmptyState
            icon={<Sparkles size={22} />}
            title="Let's build your first playlist"
            description="Search Spotify's catalog for tracks, or upload your own audio files to get a fully playable, downloadable library."
            action={
              <Button leftIcon={<Search size={16} />} variant="solid" size="md" onClick={() => navigate('/search')}>
                Search tracks
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {allPlaylists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
