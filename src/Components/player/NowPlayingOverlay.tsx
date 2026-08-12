import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Heart, Music2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, ExternalLink } from 'lucide-react';
import clsx from 'clsx';
import { usePlayer } from '@/context/PlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import { formatDuration } from '@/lib/format';
import { RangeSlider } from './RangeSlider';
import { VolumeControl } from './VolumeControl';
import { Visualizer } from './Visualizer';

interface NowPlayingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NowPlayingOverlay({ isOpen, onClose }: NowPlayingOverlayProps) {
  const player = usePlayer();
  const { isFavorite, toggleFavorite } = useLibrary();
  const { currentTrack } = player;

  if (!currentTrack) return null;
  const favorite = isFavorite(currentTrack.id);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[55] flex flex-col overflow-hidden bg-canvas"
          role="dialog"
          aria-label="Now playing"
        >
          {currentTrack.artworkUrl && (
            <div
              className="pointer-events-none absolute inset-0 opacity-30 blur-3xl"
              style={{
                backgroundImage: `url(${currentTrack.artworkUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'saturate(1.3)',
              }}
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-canvas/40 via-canvas/70 to-canvas" />

          <div className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6">
            <button onClick={onClose} aria-label="Minimize now playing" className="rounded-full p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary">
              <ChevronDown size={22} />
            </button>
            <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {currentTrack.source === 'local' ? 'Your library' : 'Spotify preview'}
            </span>
            <div className="w-9" />
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-6 pb-8">
            <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-[var(--radius-xl)] bg-surface shadow-2xl">
              {currentTrack.artworkUrl ? (
                <img src={currentTrack.artworkUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-text-tertiary">
                  <Music2 size={56} />
                </div>
              )}
            </div>

            <Visualizer className="h-16 w-full max-w-xs" />

            <div className="w-full text-center">
              <h1 className="text-balance font-display text-2xl font-bold text-text-primary sm:text-3xl">{currentTrack.name}</h1>
              <p className="mt-1 text-base text-text-secondary">{currentTrack.artist}</p>
            </div>

            <div className="w-full space-y-2">
              <RangeSlider value={player.currentTime} max={player.duration || 0.01} onChange={player.seek} ariaLabel="Seek" alwaysShowThumb />
              <div className="flex justify-between font-mono text-xs tabular-nums text-text-tertiary">
                <span>{formatDuration(player.currentTime * 1000)}</span>
                <span>{formatDuration(player.duration * 1000)}</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={player.toggleShuffle}
                aria-label="Toggle shuffle"
                aria-pressed={player.shuffle}
                className={clsx('transition-colors hover:text-text-primary', player.shuffle ? 'text-accent-text' : 'text-text-tertiary')}
              >
                <Shuffle size={19} />
              </button>
              <button onClick={player.previous} aria-label="Previous track" className="text-text-primary">
                <SkipBack size={24} fill="currentColor" />
              </button>
              <button
                onClick={player.togglePlay}
                aria-label={player.isPlaying ? 'Pause' : 'Play'}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-solid text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                {player.isLoading ? (
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : player.isPlaying ? (
                  <Pause size={26} fill="currentColor" />
                ) : (
                  <Play size={26} fill="currentColor" className="ml-1" />
                )}
              </button>
              <button onClick={player.next} aria-label="Next track" className="text-text-primary">
                <SkipForward size={24} fill="currentColor" />
              </button>
              <button
                onClick={player.cycleRepeat}
                aria-label="Toggle repeat"
                aria-pressed={player.repeat !== 'off'}
                className={clsx('transition-colors hover:text-text-primary', player.repeat !== 'off' ? 'text-accent-text' : 'text-text-tertiary')}
              >
                {player.repeat === 'one' ? <Repeat1 size={19} /> : <Repeat size={19} />}
              </button>
            </div>

            <div className="flex w-full items-center justify-between">
              <button
                onClick={() => toggleFavorite(currentTrack)}
                aria-label={favorite ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
                aria-pressed={favorite}
                className={clsx('transition-colors hover:text-ember', favorite ? 'text-ember' : 'text-text-tertiary')}
              >
                <Heart size={20} fill={favorite ? 'currentColor' : 'none'} />
              </button>
              {currentTrack.source === 'spotify' && currentTrack.externalUrl && (
                <a
                  href={currentTrack.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary"
                >
                  Open in Spotify <ExternalLink size={13} />
                </a>
              )}
              <VolumeControl />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
