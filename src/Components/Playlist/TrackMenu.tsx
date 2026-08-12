import { useState } from 'react';
import { MoreHorizontal, ListPlus, ListEnd, Heart, Download, ExternalLink, ListX, Trash2 } from 'lucide-react';
import { Popover, PopoverItem } from '@/components/common/Popover';
import { AddToPlaylistModal } from './AddToPlaylistModal';
import { usePlayer } from '@/context/PlayerContext';
import { useLibrary, LIKED_SONGS_PLAYLIST_ID, LOCAL_LIBRARY_PLAYLIST_ID } from '@/context/LibraryContext';
import { useDownloads } from '@/context/DownloadContext';
import type { Track } from '@/types';

interface TrackMenuProps {
  track: Track;
  /** When shown inside a specific playlist's track list, lets "remove" act on
   * that playlist (or delete the file, for the Local Library view). */
  removeFrom?: { playlistId: string };
}

export function TrackMenu({ track, removeFrom }: TrackMenuProps) {
  const { enqueueNext, enqueueLast } = usePlayer();
  const { isFavorite, toggleFavorite, removeTrackFromPlaylist, deleteLocalTrack } = useLibrary();
  const { downloadTrack } = useDownloads();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const favorite = isFavorite(track.id);

  return (
    <>
      <Popover
        align="end"
        trigger={({ onClick, ref }) => (
          <button
            ref={ref}
            onClick={onClick}
            aria-label={`More options for ${track.name}`}
            className="rounded-full p-1.5 text-text-tertiary opacity-0 transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:opacity-100 group-hover:opacity-100 data-[open=true]:opacity-100"
          >
            <MoreHorizontal size={18} />
          </button>
        )}
      >
        {(close) => (
          <>
            <PopoverItem
              icon={<ListPlus size={16} />}
              onClick={() => {
                enqueueNext(track);
                close();
              }}
            >
              Play next
            </PopoverItem>
            <PopoverItem
              icon={<ListEnd size={16} />}
              onClick={() => {
                enqueueLast(track);
                close();
              }}
            >
              Add to queue
            </PopoverItem>
            <PopoverItem
              icon={<Heart size={16} fill={favorite ? 'currentColor' : 'none'} />}
              onClick={() => {
                toggleFavorite(track);
                close();
              }}
            >
              {favorite ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
            </PopoverItem>
            <PopoverItem
              icon={<ListPlus size={16} />}
              onClick={() => {
                setAddModalOpen(true);
                close();
              }}
            >
              Add to playlist
            </PopoverItem>

            {track.source === 'local' && (
              <PopoverItem
                icon={<Download size={16} />}
                onClick={() => {
                  downloadTrack(track);
                  close();
                }}
              >
                Download
              </PopoverItem>
            )}
            {track.source === 'spotify' && track.externalUrl && (
              <PopoverItem
                icon={<ExternalLink size={16} />}
                onClick={() => {
                  window.open(track.externalUrl!, '_blank', 'noopener,noreferrer');
                  close();
                }}
              >
                Open in Spotify
              </PopoverItem>
            )}

            {removeFrom && removeFrom.playlistId !== LIKED_SONGS_PLAYLIST_ID && (
              <PopoverItem
                icon={removeFrom.playlistId === LOCAL_LIBRARY_PLAYLIST_ID ? <Trash2 size={16} /> : <ListX size={16} />}
                variant="danger"
                onClick={() => {
                  if (removeFrom.playlistId === LOCAL_LIBRARY_PLAYLIST_ID) {
                    deleteLocalTrack(track.id);
                  } else {
                    removeTrackFromPlaylist(removeFrom.playlistId, track.id);
                  }
                  close();
                }}
              >
                {removeFrom.playlistId === LOCAL_LIBRARY_PLAYLIST_ID ? 'Delete from library' : 'Remove from playlist'}
              </PopoverItem>
            )}
          </>
        )}
      </Popover>
      <AddToPlaylistModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} track={track} />
    </>
  );
}
