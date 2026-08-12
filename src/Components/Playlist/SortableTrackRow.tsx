import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { TrackRow } from './TrackRow';
import type { Track } from '@/types';

interface SortableTrackRowProps {
  track: Track;
  index: number;
  contextTracks: Track[];
  removeFrom?: { playlistId: string };
}

export function SortableTrackRow({ track, index, contextTracks, removeFrom }: SortableTrackRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 1 : undefined }}
    >
      <TrackRow
        track={track}
        index={index}
        contextTracks={contextTracks}
        removeFrom={removeFrom}
        dragHandle={
          <button
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${track.name}`}
            className="cursor-grab touch-none text-text-tertiary opacity-0 hover:text-text-primary group-hover:opacity-100 active:cursor-grabbing"
          >
            <GripVertical size={15} />
          </button>
        }
      />
    </div>
  );
}
