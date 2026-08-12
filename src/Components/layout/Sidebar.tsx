import { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { Home, Search, Download, Heart, FolderOpen, Plus, Upload, ListMusic } from 'lucide-react';
import { Wordmark } from './Wordmark';
import { useLibrary, LIKED_SONGS_PLAYLIST_ID, LOCAL_LIBRARY_PLAYLIST_ID } from '@/context/LibraryContext';
import { useToast } from '@/context/ToastContext';

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/search', label: 'Search', icon: Search, end: false },
  { to: '/downloads', label: 'Downloads', icon: Download, end: false },
];

function navLinkClass({ isActive }: { isActive: boolean }) {
  return clsx(
    'flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-accent-wash text-accent-text' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
  );
}

export function Sidebar() {
  const { playlists, likedSongs, localLibrary, createPlaylist, uploadFiles } = useLibrary();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNewPlaylist = () => {
    const id = createPlaylist('New Playlist');
    showToast({ variant: 'success', title: 'Playlist created', description: 'Give it a name from the playlist page.' });
    window.setTimeout(() => document.getElementById(`playlist-link-${id}`)?.focus(), 50);
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-canvas-raised px-3 py-5">
      <NavLink to="/" className="mb-6 flex items-center gap-2 px-2">
        <Wordmark />
      </NavLink>

      <nav className="space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="my-4 border-t border-border" />

      <nav className="space-y-1">
        <NavLink to={`/playlist/${LIKED_SONGS_PLAYLIST_ID}`} className={navLinkClass}>
          <Heart size={18} />
          Liked Songs
          {likedSongs.trackIds.length > 0 && <span className="ml-auto text-xs text-text-tertiary">{likedSongs.trackIds.length}</span>}
        </NavLink>
        <NavLink to={`/playlist/${LOCAL_LIBRARY_PLAYLIST_ID}`} className={navLinkClass}>
          <FolderOpen size={18} />
          Local Library
          {localLibrary.trackIds.length > 0 && <span className="ml-auto text-xs text-text-tertiary">{localLibrary.trackIds.length}</span>}
        </NavLink>
      </nav>

      <div className="mt-4 mb-2 flex items-center justify-between px-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Your Playlists</span>
        <button
          onClick={handleNewPlaylist}
          aria-label="Create new playlist"
          className="rounded-full p-1 text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
        >
          <Plus size={16} />
        </button>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        {playlists.length === 0 && (
          <p className="px-2 py-3 text-xs leading-relaxed text-text-tertiary">No playlists yet. Create one, or add a track from search.</p>
        )}
        {playlists.map((playlist) => (
          <NavLink key={playlist.id} id={`playlist-link-${playlist.id}`} to={`/playlist/${playlist.id}`} className={navLinkClass}>
            <ListMusic size={18} className="shrink-0" />
            <span className="truncate">{playlist.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-3 border-t border-border pt-3">
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
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          <Upload size={18} />
          Upload audio files
        </button>
      </div>
    </aside>
  );
}
