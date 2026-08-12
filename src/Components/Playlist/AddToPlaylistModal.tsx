import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useLibrary } from '@/context/LibraryContext';
import type { Track } from '@/types';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}

export function AddToPlaylistModal({ isOpen, onClose, track }: AddToPlaylistModalProps) {
  const { playlists, addTrackToPlaylists, createPlaylist } = useLibrary();
  const [newName, setNewName] = useState('');

  if (!track) return null;

  const handleToggle = (playlistId: string, alreadyIn: boolean) => {
    if (alreadyIn) return; // keep it simple: this modal only adds, removal happens from the playlist view
    addTrackToPlaylists(track, [playlistId]);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = createPlaylist(newName.trim());
    addTrackToPlaylists(track, [id]);
    setNewName('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add to playlist">
      <p className="mb-3 truncate text-sm text-text-secondary">
        <span className="text-text-primary">{track.name}</span> · {track.artist}
      </p>

      <div className="mb-4 max-h-64 space-y-0.5 overflow-y-auto">
        {playlists.length === 0 && <p className="py-4 text-center text-sm text-text-tertiary">No playlists yet — create one below.</p>}
        {playlists.map((playlist) => {
          const alreadyIn = playlist.trackIds.includes(track.id);
          return (
            <button
              key={playlist.id}
              onClick={() => handleToggle(playlist.id, alreadyIn)}
              disabled={alreadyIn}
              className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-hover disabled:cursor-default"
            >
              <span className="truncate text-text-primary">{playlist.name}</span>
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                style={{
                  borderColor: alreadyIn ? 'var(--accent-solid)' : 'var(--border-strong)',
                  backgroundColor: alreadyIn ? 'var(--accent-solid)' : 'transparent',
                }}
              >
                {alreadyIn && <Check size={13} className="text-white" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 border-t border-border pt-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="New playlist name"
          className="h-10 flex-1 rounded-[var(--radius-sm)] border border-border-strong bg-canvas px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
        />
        <Button size="md" variant="outline" leftIcon={<Plus size={16} />} onClick={handleCreate} disabled={!newName.trim()}>
          Create
        </Button>
      </div>
    </Modal>
  );
}
