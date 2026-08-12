import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, Shuffle, Trash2, Music2, Upload, Search as SearchIcon, Heart, FolderOpen } from 'lucide-react';
import { useLibrary, LIKED_SONGS_PLAYLIST_ID, LOCAL_LIBRARY_PLAYLIST_ID } from '@/context/LibraryContext';
import { usePlayer } from '@/context/PlayerContext';
import { TrackList } from '@/components/playlist/TrackList';
import { DownloadPlaylistButton } from '@/components/playlist/DownloadPlaylistButton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { formatTotalDuration } from '@/lib/format';

export function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPlaylist, resolveTracks, renamePlaylist, deletePlaylist, reorderTracks, uploadFiles } = useLibrary();
  const { playNow, shuffle, toggleShuffle } = usePlayer();

  const playlist = id ? getPlaylist(id) : undefined;
  const tracks = useMemo(() => resolveTracks(playlist?.trackIds ?? []), [playlist, resolveTracks]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(playlist?.name ?? '');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!playlist || !id) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <EmptyState
          icon={<Music2 size={22} />}
          title="Playlist not found"
          description="It may have been deleted."
          action={<Button onClick={() => navigate('/')}>Back to Home</Button>}
        />
      </div>
    );
  }

  const isLiked = playlist.id === LIKED_SONGS_PLAYLIST_ID;
  const isLocalLibrary = playlist.id === LOCAL_LIBRARY_PLAYLIST_ID;
  const isSystem = Boolean(playlist.isSystem);

  const handlePlay = () => tracks.length > 0 && playNow(tracks[0], tracks);
  const handleShufflePlay = () => {
    if (tracks.length === 0) return;
    if (!shuffle) toggleShuffle();
    playNow(tracks[Math.floor(Math.random() * tracks.length)], tracks);
  };

  const commitName = () => {
    setIsEditingName(false);
    if (nameDraft.trim() && nameDraft !== playlist.name) renamePlaylist(playlist.id, nameDraft.trim());
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-[var(--radius-lg)] shadow-lg sm:mx-0 sm:h-48 sm:w-48">
          {isLiked ? (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ember to-danger-solid">
              <Heart size={56} className="text-white" fill="white" />
            </div>
          ) : isLocalLibrary ? (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent to-accent-solid">
              <FolderOpen size={56} className="text-white" />
            </div>
          ) : tracks[0]?.artworkUrl ? (
            <img src={tracks[0].artworkUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface text-text-tertiary">
              <Music2 size={48} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">{isSystem ? 'Collection' : 'Playlist'}</p>
          {isEditingName ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => e.key === 'Enter' && commitName()}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-accent bg-canvas px-2 py-1 font-display text-3xl font-bold text-text-primary focus:outline-none sm:text-4xl"
            />
          ) : (
            <h1
              onClick={() => {
                if (isSystem) return;
                setNameDraft(playlist.name);
                setIsEditingName(true);
              }}
              className={`mt-1 text-balance font-display text-3xl font-bold text-text-primary sm:text-4xl ${!isSystem ? 'cursor-text hover:opacity-80' : ''}`}
            >
              {playlist.name}
            </h1>
          )}
          <p className="mt-2 text-sm text-text-secondary">
            {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
            {tracks.length > 0 && ` · ${formatTotalDuration(tracks.map((t) => t.durationMs))}`}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <Button size="lg" leftIcon={<Play size={17} fill="currentColor" />} onClick={handlePlay} disabled={tracks.length === 0}>
          Play
        </Button>
        <Button
          variant="outline"
          size="lg"
          leftIcon={<Shuffle size={16} />}
          onClick={handleShufflePlay}
          disabled={tracks.length === 0}
        >
          Shuffle
        </Button>
        <DownloadPlaylistButton playlist={playlist} tracks={tracks} />

        {isLocalLibrary && (
          <>
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
            <Button variant="outline" size="md" leftIcon={<Upload size={16} />} onClick={() => fileInputRef.current?.click()}>
              Upload files
            </Button>
          </>
        )}
        {!isSystem && (
          <Button variant="ghost" size="md" onClick={() => navigate('/search')} leftIcon={<SearchIcon size={16} />}>
            Add tracks
          </Button>
        )}
        {!isSystem && (
          <Button variant="ghost" size="md" leftIcon={<Trash2 size={16} />} onClick={() => setConfirmDeleteOpen(true)} className="ml-auto">
            Delete
          </Button>
        )}
      </div>

      <div className="mt-8">
        <TrackList
          tracks={tracks}
          removeFrom={{ playlistId: playlist.id }}
          onReorder={!isSystem ? (ids) => reorderTracks(playlist.id, ids) : undefined}
          emptyState={
            <EmptyState
              icon={isLocalLibrary ? <Upload size={22} /> : <SearchIcon size={22} />}
              title={isLocalLibrary ? 'No local files yet' : 'This playlist is empty'}
              description={
                isLocalLibrary
                  ? 'Upload your own audio files to play, visualize, and download them.'
                  : 'Search for tracks and add them from their "..." menu.'
              }
              action={
                isLocalLibrary ? (
                  <Button leftIcon={<Upload size={16} />} onClick={() => fileInputRef.current?.click()}>
                    Upload files
                  </Button>
                ) : (
                  <Button leftIcon={<SearchIcon size={16} />} onClick={() => navigate('/search')}>
                    Search tracks
                  </Button>
                )
              }
            />
          }
        />
      </div>

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          deletePlaylist(playlist.id);
          navigate('/');
        }}
        title="Delete playlist?"
        description={`"${playlist.name}" will be removed. This won't delete any local files, and Spotify tracks stay on Spotify.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
