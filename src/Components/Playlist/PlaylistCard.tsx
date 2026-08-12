import { Link } from 'react-router-dom';
import { Play, Music2, Heart, FolderOpen } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import { LIKED_SONGS_PLAYLIST_ID, LOCAL_LIBRARY_PLAYLIST_ID } from '@/context/LibraryContext';
import type { Playlist } from '@/types';

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const { resolveTracks } = useLibrary();
  const { playNow } = usePlayer();
  const tracks = resolveTracks(playlist.trackIds);
  const artworks = tracks.map((t) => t.artworkUrl).filter((url): url is string => Boolean(url));
  const uniqueArt = Array.from(new Set(artworks)).slice(0, 4);

  const isLiked = playlist.id === LIKED_SONGS_PLAYLIST_ID;
  const isLocal = playlist.id === LOCAL_LIBRARY_PLAYLIST_ID;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    if (tracks.length > 0) playNow(tracks[0], tracks);
  };

  return (
    <Link to={`/playlist/${playlist.id}`} className="group block">
      <div className="relative mb-3 aspect-square overflow-hidden rounded-[var(--radius-md)] bg-surface shadow-sm">
        {isLiked ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ember to-danger-solid">
            <Heart size={40} className="text-white" fill="white" />
          </div>
        ) : isLocal ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent to-accent-solid">
            <FolderOpen size={40} className="text-white" />
          </div>
        ) : uniqueArt.length >= 4 ? (
          <div className="grid h-full w-full grid-cols-2 grid-rows-2">
            {uniqueArt.map((url, i) => (
              <img key={i} src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
            ))}
          </div>
        ) : uniqueArt.length > 0 ? (
          <img src={uniqueArt[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-tertiary">
            <Music2 size={36} />
          </div>
        )}

        {tracks.length > 0 && (
          <button
            onClick={handlePlay}
            aria-label={`Play ${playlist.name}`}
            className="absolute bottom-2 right-2 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-accent-solid text-white opacity-0 shadow-lg transition-all duration-200 hover:scale-105 group-hover:translate-y-0 group-hover:opacity-100"
          >
            <Play size={16} fill="currentColor" className="ml-0.5" />
          </button>
        )}
      </div>
      <p className="truncate text-sm font-semibold text-text-primary">{playlist.name}</p>
      <p className="truncate text-xs text-text-secondary">{tracks.length === 1 ? '1 track' : `${tracks.length} tracks`}</p>
    </Link>
  );
}
