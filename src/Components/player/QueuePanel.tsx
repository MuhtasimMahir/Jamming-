import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Music2, X, Play } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { formatDuration } from '@/lib/format';
import { EqualizerBars } from '@/components/common/EqualizerBars';
import type { Track } from '@/types';

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function QueueRow({ track }: { track: Track }) {
  const { removeFromQueue, playNow, queueList } = usePlayer();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="group flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 hover:bg-surface-hover"
    >
      <button {...attributes} {...listeners} aria-label={`Reorder ${track.name}`} className="cursor-grab touch-none text-text-tertiary active:cursor-grabbing">
        <GripVertical size={14} />
      </button>
      <button onClick={() => playNow(track, queueList)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
        <span className="h-9 w-9 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-hover">
          {track.artworkUrl ? <img src={track.artworkUrl} alt="" className="h-full w-full object-cover" /> : <Music2 size={14} className="m-auto mt-2.5 text-text-tertiary" />}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm text-text-primary">{track.name}</span>
          <span className="block truncate text-xs text-text-secondary">{track.artist}</span>
        </span>
      </button>
      <span className="font-mono text-[11px] tabular-nums text-text-tertiary">{formatDuration(track.durationMs)}</span>
      <button
        onClick={() => removeFromQueue(track.id)}
        aria-label={`Remove ${track.name} from queue`}
        className="text-text-tertiary opacity-0 hover:text-danger-text group-hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function QueuePanel({ isOpen, onClose }: QueuePanelProps) {
  const { currentTrack, upNext, reorderUpcoming, isPlaying } = usePlayer();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = upNext.findIndex((t) => t.id === active.id);
    const newIndex = upNext.findIndex((t) => t.id === over.id);
    reorderUpcoming(arrayMove(upNext, oldIndex, newIndex).map((t) => t.id));
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[var(--scrim)] sm:hidden"
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-border bg-canvas-raised pb-24 sm:pb-28"
            role="dialog"
            aria-label="Playback queue"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <h2 className="font-display text-base font-semibold text-text-primary">Queue</h2>
              <button onClick={onClose} aria-label="Close queue" className="rounded-full p-1.5 text-text-tertiary hover:bg-surface-hover hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              {currentTrack && (
                <div className="mb-3">
                  <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Now playing</p>
                  <div className="flex items-center gap-2.5 rounded-[var(--radius-sm)] bg-accent-wash px-2 py-2">
                    <span className="h-9 w-9 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-hover">
                      {currentTrack.artworkUrl ? (
                        <img src={currentTrack.artworkUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Music2 size={14} className="m-auto mt-2.5 text-text-tertiary" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-accent-text">{currentTrack.name}</span>
                      <span className="block truncate text-xs text-text-secondary">{currentTrack.artist}</span>
                    </span>
                    {isPlaying ? (
                      <EqualizerBars className="text-accent" />
                    ) : (
                      <Play size={14} className="text-text-tertiary" fill="currentColor" />
                    )}
                  </div>
                </div>
              )}

              <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                Next up {upNext.length > 0 && `· ${upNext.length}`}
              </p>
              {upNext.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-text-tertiary">Nothing queued. Add tracks with "Play next" or "Add to queue".</p>
              ) : (
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                  <SortableContext items={upNext.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-0.5">
                      {upNext.map((track) => (
                        <QueueRow key={track.id} track={track} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
