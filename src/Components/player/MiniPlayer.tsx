import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Music2, ListMusic, Heart } from 'lucide-react';
import clsx from 'clsx';
import { usePlayer } from '@/context/PlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import { formatDuration } from '@/lib/format';
import { RangeSlider } from './RangeSlider';
import { VolumeControl } from './VolumeControl';

interface MiniPlayerProps {
  onExpand: () => void;
  onToggleQueue: () => void;
}

export function MiniPlayer({ onExpand, onToggleQueue }: MiniPlayerProps) {
  const player = usePlayer();
  const { isFavorite, toggleFavorite } = useLibrary();
  const { currentTrack } = player;

  if (!currentTrack) return null;
  const favorite = isFavorite(currentTrack.id);

  return (
    <div className="shrink-0 border-t border-border bg-canvas-raised">
      {/* mobile: thin tappable progress + compact row */}
      <button className="block w-full sm:hidden" onClick={onExpand} aria-label="Expand now playing">
        <div className="h-0.5 w-full bg-border-strong">
          <div className="h-full bg-accent" style={{ width: `${player.duration ? (player.currentTime / player.duration) * 100 : 0}%` }} />
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-hover">
            {currentTrack.artworkUrl ? (
              <img src={currentTrack.artworkUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Music2 size={16} className="m-auto mt-3 text-text-tertiary" />
            )}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-medium text-text-primary">{currentTrack.name}</span>
            <span className="block truncate text-xs text-text-secondary">{currentTrack.artist}</span>
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              player.togglePlay();
            }}
            onKeyDown={(e) => e.key === 'Enter' && player.togglePlay()}
            aria-label={player.isPlaying ? 'Pause' : 'Play'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-solid text-white"
          >
            {player.isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
          </span>
        </div>
      </button>

      {/* desktop: full transport */}
      <div className="hidden h-20 items-center gap-4 px-4 sm:flex">
        <button onClick={onExpand} className="flex min-w-0 shrink-0 items-center gap-3" style={{ width: 240 }}>
          <span className="h-12 w-12 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-hover">
            {currentTrack.artworkUrl ? (
              <img src={currentTrack.artworkUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Music2 size={18} className="m-auto mt-3.5 text-text-tertiary" />
            )}
          </span>
          <span className="min-w-0 text-left">
            <span className="block truncate text-sm font-medium text-text-primary">{currentTrack.name}</span>
            <span className="block truncate text-xs text-text-secondary">{currentTrack.artist}</span>
          </span>
        </button>

        <button
          onClick={() => toggleFavorite(currentTrack)}
          aria-label={favorite ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
          aria-pressed={favorite}
          className={clsx('shrink-0 transition-colors hover:text-ember', favorite ? 'text-ember' : 'text-text-tertiary')}
        >
          <Heart size={17} fill={favorite ? 'currentColor' : 'none'} />
        </button>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <div className="flex items-center gap-4">
            <button
              onClick={player.toggleShuffle}
              aria-label="Toggle shuffle"
              aria-pressed={player.shuffle}
              className={clsx('transition-colors hover:text-text-primary', player.shuffle ? 'text-accent-text' : 'text-text-tertiary')}
            >
              <Shuffle size={17} />
            </button>
            <button onClick={player.previous} aria-label="Previous track" className="text-text-secondary hover:text-text-primary">
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button
              onClick={player.togglePlay}
              aria-label={player.isPlaying ? 'Pause' : 'Play'}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-solid text-white transition-transform hover:scale-105 active:scale-95"
            >
              {player.isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : player.isPlaying ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" className="ml-0.5" />
              )}
            </button>
            <button onClick={player.next} aria-label="Next track" className="text-text-secondary hover:text-text-primary">
              <SkipForward size={18} fill="currentColor" />
            </button>
            <button
              onClick={player.cycleRepeat}
              aria-label="Toggle repeat"
              aria-pressed={player.repeat !== 'off'}
              className={clsx('transition-colors hover:text-text-primary', player.repeat !== 'off' ? 'text-accent-text' : 'text-text-tertiary')}
            >
              {player.repeat === 'one' ? <Repeat1 size={17} /> : <Repeat size={17} />}
            </button>
          </div>
          <div className="flex w-full max-w-xl items-center gap-2">
            <span className="w-9 text-right font-mono text-[11px] tabular-nums text-text-tertiary">
              {formatDuration(player.currentTime * 1000)}
            </span>
            <RangeSlider value={player.currentTime} max={player.duration || 0.01} onChange={player.seek} ariaLabel="Seek" />
            <span className="w-9 font-mono text-[11px] tabular-nums text-text-tertiary">{formatDuration(player.duration * 1000)}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3" style={{ width: 200, justifyContent: 'flex-end' }}>
          <button onClick={onToggleQueue} aria-label="Toggle queue" className="text-text-tertiary hover:text-text-primary">
            <ListMusic size={18} />
          </button>
          <VolumeControl />
        </div>
      </div>
    </div>
  );
}
