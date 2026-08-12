import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TrackRow } from './TrackRow';
import { SortableTrackRow } from './SortableTrackRow';
import type { Track } from '@/types';
import type { ReactNode } from 'react';

interface TrackListProps {
  tracks: Track[];
  contextTracks?: Track[];
  removeFrom?: { playlistId: string };
  showAlbum?: boolean;
  onReorder?: (newTrackIds: string[]) => void;
  emptyState?: ReactNode;
}

export function TrackList({ tracks, contextTracks, removeFrom, showAlbum = true, onReorder, emptyState }: TrackListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (tracks.length === 0 && emptyState) return <>{emptyState}</>;

  if (onReorder) {
    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = tracks.findIndex((t) => t.id === active.id);
      const newIndex = tracks.findIndex((t) => t.id === over.id);
      onReorder(arrayMove(tracks, oldIndex, newIndex).map((t) => t.id));
    };

    return (
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={tracks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-0.5">
            {tracks.map((track, i) => (
              <SortableTrackRow key={track.id} track={track} index={i + 1} contextTracks={contextTracks ?? tracks} removeFrom={removeFrom} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  return (
    <div className="space-y-0.5">
      {tracks.map((track, i) => (
        <TrackRow
          key={track.id}
          track={track}
          index={i + 1}
          contextTracks={contextTracks ?? tracks}
          removeFrom={removeFrom}
          showAlbum={showAlbum}
        />
      ))}
    </div>
  );
}
