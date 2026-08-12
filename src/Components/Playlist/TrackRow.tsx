import { Play, Pause, Heart, Music2 } from 'lucide-react';
import clsx from 'clsx';
import { usePlayer, isPlayableTrack } from '@/context/PlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import { formatDuration } from '@/lib/format';
import { TrackMenu } from './TrackMenu';
import type { Track } from '@/types';

interface TrackRowProps {
  track: Track;
  index: number;
  contextTracks: Track[];
  removeFrom?: { playlistId: string };
  showAlbum?: boolean;
  dragHandle?: React.ReactNode;
}

export function TrackRow({ track, index, contextTracks, removeFrom, showAlbum = true, dragHandle }: TrackRowProps) {
  const { currentTrack, isPlaying, playNow, togglePlay } = usePlayer();
  const { isFavorite, toggleFavorite } = useLibrary();

  const isCurrent = currentTrack?.id === track.id;
  const playable = isPlayableTrack(track);
  const favorite = isFavorite(track.id);

  const handlePlayClick = () => {
    if (isCurrent) togglePlay();
    else playNow(track, contextTracks);
  };

  return (
    <div
      className={clsx(
        'group grid grid-cols-[16px_auto_1fr_auto_auto_auto_auto] items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 transition-colors',
        isCurrent ? 'bg-accent-wash' : 'hover:bg-surface-hover',
      )}
    >
      <span className="flex h-4 w-4 items-center justify-center text-text-tertiary">{dragHandle}</span>

      <button
        onClick={handlePlayClick}
        disabled={!playable}
        aria-label={isCurrent && isPlaying ? `Pause ${track.name}` : `Play ${track.name}`}
        className="flex h-6 w-6 items-center justify-center text-text-tertiary disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span className={clsx(isCurrent ? 'flex' : 'hidden group-hover:flex')}>
          {isCurrent && isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
        </span>
        <span
          className={clsx(
            'font-mono text-xs tabular-nums',
            isCurrent ? 'hidden' : 'group-hover:hidden',
            isCurrent && 'text-accent-text',
          )}
        >
          {index}
        </span>
      </button>

      <button
        onClick={handlePlayClick}
        disabled={!playable}
        className="flex min-w-0 items-center gap-3 text-left disabled:cursor-not-allowed"
      >
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-hover">
          {track.artworkUrl ? (
            <img src={track.artworkUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-text-tertiary">
              <Music2 size={16} />
            </span>
          )}
        </span>
        <span className="min-w-0">
          <span className={clsx('block truncate text-sm font-medium', isCurrent ? 'text-accent-text' : 'text-text-primary')}>
            {track.name}
          </span>
          <span className="block truncate text-xs text-text-secondary">
            {track.artist}
            {!playable && ' · No preview'}
          </span>
        </span>
      </button>

      {showAlbum ? (
        <span className="hidden truncate text-sm text-text-secondary lg:block">{track.album}</span>
      ) : (
        <span className="hidden lg:block" />
      )}

      <button
        onClick={() => toggleFavorite(track)}
        aria-label={favorite ? `Remove ${track.name} from Liked Songs` : `Add ${track.name} to Liked Songs`}
        aria-pressed={favorite}
        className={clsx(
          'flex h-6 w-6 items-center justify-center text-text-tertiary transition-colors hover:text-ember',
          favorite ? 'text-ember opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
        )}
      >
        <Heart size={15} fill={favorite ? 'currentColor' : 'none'} />
      </button>

      <span className="font-mono text-xs tabular-nums text-text-tertiary">{formatDuration(track.durationMs)}</span>

      <TrackMenu track={track} removeFrom={removeFrom} />
    </div>
  );
}
