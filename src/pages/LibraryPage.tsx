import { useRef } from 'react';
import { Plus, Upload } from 'lucide-react';
import { useLibrary } from '@/context/LibraryContext';
import { PlaylistCard } from '@/components/playlist/PlaylistCard';
import { Button } from '@/components/common/Button';
import { useToast } from '@/context/ToastContext';

export function LibraryPage() {
  const { playlists, likedSongs, localLibrary, createPlaylist, uploadFiles } = useLibrary();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allPlaylists = [likedSongs, localLibrary, ...playlists];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">Your Library</h1>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) uploadFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <Button variant="outline" size="sm" leftIcon={<Upload size={15} />} onClick={() => fileInputRef.current?.click()}>
            Upload
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => {
              createPlaylist('New Playlist');
              showToast({ variant: 'success', title: 'Playlist created' });
            }}
          >
            New playlist
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {allPlaylists.map((playlist) => (
          <PlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </div>
    </div>
  );
}
