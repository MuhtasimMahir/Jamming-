import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { LocalTrack, PlayHistoryEntry, Playlist, Track } from '@/types';
import { createId } from '@/lib/id';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';
import { createLocalTrackFromFile, isAudioFile } from '@/lib/audioFile';
import { deleteAudioBlob } from '@/lib/db';
import { useToast } from './ToastContext';

export const LIKED_SONGS_PLAYLIST_ID = 'system-liked-songs';
export const LOCAL_LIBRARY_PLAYLIST_ID = 'system-local-library';
const HISTORY_LIMIT = 50;

interface LibraryState {
  playlists: Playlist[];
  tracksById: Record<string, Track>;
  history: PlayHistoryEntry[];
}

function systemPlaylist(id: string, name: string): Playlist {
  const now = Date.now();
  return { id, name, description: '', trackIds: [], createdAt: now, updatedAt: now, isSystem: true };
}

function defaultState(): LibraryState {
  return {
    playlists: [
      systemPlaylist(LIKED_SONGS_PLAYLIST_ID, 'Liked Songs'),
      systemPlaylist(LOCAL_LIBRARY_PLAYLIST_ID, 'Local Library'),
    ],
    tracksById: {},
    history: [],
  };
}

function hydrateState(): LibraryState {
  const fallback = defaultState();
  const playlists = loadJSON<Playlist[]>(STORAGE_KEYS.playlists, fallback.playlists);
  const tracksById = loadJSON<Record<string, Track>>(STORAGE_KEYS.localTracks, fallback.tracksById);
  const history = loadJSON<PlayHistoryEntry[]>(STORAGE_KEYS.history, fallback.history);
  // Guard against a corrupted/older shape missing the system playlists.
  const hasLiked = playlists.some((p) => p.id === LIKED_SONGS_PLAYLIST_ID);
  const hasLocal = playlists.some((p) => p.id === LOCAL_LIBRARY_PLAYLIST_ID);
  return {
    playlists: [
      ...(hasLiked ? [] : [systemPlaylist(LIKED_SONGS_PLAYLIST_ID, 'Liked Songs')]),
      ...(hasLocal ? [] : [systemPlaylist(LOCAL_LIBRARY_PLAYLIST_ID, 'Local Library')]),
      ...playlists,
    ],
    tracksById,
    history,
  };
}

type LibraryAction =
  | { type: 'CREATE_PLAYLIST'; playlist: Playlist }
  | { type: 'RENAME_PLAYLIST'; id: string; name: string }
  | { type: 'SET_DESCRIPTION'; id: string; description: string }
  | { type: 'DELETE_PLAYLIST'; id: string }
  | { type: 'REORDER_TRACKS'; playlistId: string; trackIds: string[] }
  | { type: 'ADD_TRACK_TO_PLAYLISTS'; track: Track; playlistIds: string[] }
  | { type: 'REMOVE_TRACK_FROM_PLAYLIST'; playlistId: string; trackId: string }
  | { type: 'ADD_LOCAL_TRACKS'; tracks: LocalTrack[] }
  | { type: 'DELETE_LOCAL_TRACK'; trackId: string }
  | { type: 'RECORD_PLAY'; trackId: string };

function reducer(state: LibraryState, action: LibraryAction): LibraryState {
  switch (action.type) {
    case 'CREATE_PLAYLIST':
      return { ...state, playlists: [...state.playlists, action.playlist] };

    case 'RENAME_PLAYLIST':
      return {
        ...state,
        playlists: state.playlists.map((p) =>
          p.id === action.id ? { ...p, name: action.name, updatedAt: Date.now() } : p,
        ),
      };

    case 'SET_DESCRIPTION':
      return {
        ...state,
        playlists: state.playlists.map((p) =>
          p.id === action.id ? { ...p, description: action.description, updatedAt: Date.now() } : p,
        ),
      };

    case 'DELETE_PLAYLIST':
      return { ...state, playlists: state.playlists.filter((p) => p.id !== action.id) };

    case 'REORDER_TRACKS':
      return {
        ...state,
        playlists: state.playlists.map((p) =>
          p.id === action.playlistId ? { ...p, trackIds: action.trackIds, updatedAt: Date.now() } : p,
        ),
      };

    case 'ADD_TRACK_TO_PLAYLISTS': {
      const playlistIds = new Set(action.playlistIds);
      return {
        ...state,
        tracksById: { ...state.tracksById, [action.track.id]: action.track },
        playlists: state.playlists.map((p) => {
          if (!playlistIds.has(p.id) || p.trackIds.includes(action.track.id)) return p;
          return { ...p, trackIds: [...p.trackIds, action.track.id], updatedAt: Date.now() };
        }),
      };
    }

    case 'REMOVE_TRACK_FROM_PLAYLIST':
      return {
        ...state,
        playlists: state.playlists.map((p) =>
          p.id === action.playlistId
            ? { ...p, trackIds: p.trackIds.filter((id) => id !== action.trackId), updatedAt: Date.now() }
            : p,
        ),
      };

    case 'ADD_LOCAL_TRACKS': {
      const nextTracksById = { ...state.tracksById };
      for (const track of action.tracks) nextTracksById[track.id] = track;
      const newIds = action.tracks.map((t) => t.id);
      return {
        ...state,
        tracksById: nextTracksById,
        playlists: state.playlists.map((p) =>
          p.id === LOCAL_LIBRARY_PLAYLIST_ID ? { ...p, trackIds: [...p.trackIds, ...newIds], updatedAt: Date.now() } : p,
        ),
      };
    }

    case 'DELETE_LOCAL_TRACK': {
      const nextTracksById = { ...state.tracksById };
      delete nextTracksById[action.trackId];
      return {
        ...state,
        tracksById: nextTracksById,
        playlists: state.playlists.map((p) => ({
          ...p,
          trackIds: p.trackIds.filter((id) => id !== action.trackId),
        })),
      };
    }

    case 'RECORD_PLAY': {
      const withoutDupes = state.history.filter((h) => h.trackId !== action.trackId);
      const history = [{ trackId: action.trackId, playedAt: Date.now() }, ...withoutDupes].slice(0, HISTORY_LIMIT);
      return { ...state, history };
    }

    default:
      return state;
  }
}

interface LibraryContextValue {
  playlists: Playlist[];
  likedSongs: Playlist;
  localLibrary: Playlist;
  getPlaylist: (id: string) => Playlist | undefined;
  getTrack: (id: string) => Track | undefined;
  resolveTracks: (ids: string[]) => Track[];
  isFavorite: (trackId: string) => boolean;
  toggleFavorite: (track: Track) => void;
  createPlaylist: (name: string) => string;
  renamePlaylist: (id: string, name: string) => void;
  setPlaylistDescription: (id: string, description: string) => void;
  deletePlaylist: (id: string) => void;
  reorderTracks: (playlistId: string, trackIds: string[]) => void;
  addTrackToPlaylists: (track: Track, playlistIds: string[]) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  uploadFiles: (files: FileList | File[]) => Promise<LocalTrack[]>;
  deleteLocalTrack: (trackId: string) => Promise<void>;
  recordPlay: (trackId: string) => void;
  recentlyPlayed: Track[];
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, hydrateState);
  const { showToast } = useToast();

  useEffect(() => saveJSON(STORAGE_KEYS.playlists, state.playlists), [state.playlists]);
  useEffect(() => saveJSON(STORAGE_KEYS.localTracks, state.tracksById), [state.tracksById]);
  useEffect(() => saveJSON(STORAGE_KEYS.history, state.history), [state.history]);

  const likedSongs = useMemo(
    () => state.playlists.find((p) => p.id === LIKED_SONGS_PLAYLIST_ID) ?? systemPlaylist(LIKED_SONGS_PLAYLIST_ID, 'Liked Songs'),
    [state.playlists],
  );
  const localLibrary = useMemo(
    () => state.playlists.find((p) => p.id === LOCAL_LIBRARY_PLAYLIST_ID) ?? systemPlaylist(LOCAL_LIBRARY_PLAYLIST_ID, 'Local Library'),
    [state.playlists],
  );
  const userPlaylists = useMemo(() => state.playlists.filter((p) => !p.isSystem), [state.playlists]);

  const getTrack = useCallback((id: string) => state.tracksById[id], [state.tracksById]);
  const resolveTracks = useCallback(
    (ids: string[]) => ids.map((id) => state.tracksById[id]).filter((t): t is Track => Boolean(t)),
    [state.tracksById],
  );
  const isFavorite = useCallback((trackId: string) => likedSongs.trackIds.includes(trackId), [likedSongs]);

  const toggleFavorite = useCallback(
    (track: Track) => {
      if (isFavorite(track.id)) {
        dispatch({ type: 'REMOVE_TRACK_FROM_PLAYLIST', playlistId: LIKED_SONGS_PLAYLIST_ID, trackId: track.id });
      } else {
        dispatch({ type: 'ADD_TRACK_TO_PLAYLISTS', track, playlistIds: [LIKED_SONGS_PLAYLIST_ID] });
      }
    },
    [isFavorite],
  );

  const createPlaylist = useCallback((name: string) => {
    const id = createId();
    const now = Date.now();
    dispatch({
      type: 'CREATE_PLAYLIST',
      playlist: { id, name: name.trim() || 'New Playlist', description: '', trackIds: [], createdAt: now, updatedAt: now },
    });
    return id;
  }, []);

  const addTrackToPlaylists = useCallback((track: Track, playlistIds: string[]) => {
    if (playlistIds.length === 0) return;
    dispatch({ type: 'ADD_TRACK_TO_PLAYLISTS', track, playlistIds });
  }, []);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter(isAudioFile);
      if (list.length === 0) {
        showToast({ variant: 'warning', title: 'No audio files found', description: 'Try MP3, WAV, OGG, FLAC, M4A, or AAC.' });
        return [];
      }
      const tracks = await Promise.all(list.map(createLocalTrackFromFile));
      dispatch({ type: 'ADD_LOCAL_TRACKS', tracks });
      showToast({
        variant: 'success',
        title: tracks.length === 1 ? 'Added 1 track' : `Added ${tracks.length} tracks`,
        description: 'Saved to your Local Library.',
      });
      return tracks;
    },
    [showToast],
  );

  const deleteLocalTrack = useCallback(async (trackId: string) => {
    const track = state.tracksById[trackId];
    dispatch({ type: 'DELETE_LOCAL_TRACK', trackId });
    if (track && track.source === 'local') {
      await deleteAudioBlob(track.blobKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.tracksById]);

  const recentlyPlayed = useMemo(
    () => state.history.map((h) => state.tracksById[h.trackId]).filter((t): t is Track => Boolean(t)),
    [state.history, state.tracksById],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      playlists: userPlaylists,
      likedSongs,
      localLibrary,
      getPlaylist: (id) => state.playlists.find((p) => p.id === id),
      getTrack,
      resolveTracks,
      isFavorite,
      toggleFavorite,
      createPlaylist,
      renamePlaylist: (id, name) => dispatch({ type: 'RENAME_PLAYLIST', id, name: name.trim() || 'Untitled playlist' }),
      setPlaylistDescription: (id, description) => dispatch({ type: 'SET_DESCRIPTION', id, description }),
      deletePlaylist: (id) => dispatch({ type: 'DELETE_PLAYLIST', id }),
      reorderTracks: (playlistId, trackIds) => dispatch({ type: 'REORDER_TRACKS', playlistId, trackIds }),
      addTrackToPlaylists,
      removeTrackFromPlaylist: (playlistId, trackId) => dispatch({ type: 'REMOVE_TRACK_FROM_PLAYLIST', playlistId, trackId }),
      uploadFiles,
      deleteLocalTrack,
      recordPlay: (trackId) => dispatch({ type: 'RECORD_PLAY', trackId }),
      recentlyPlayed,
    }),
    [
      userPlaylists,
      likedSongs,
      localLibrary,
      state.playlists,
      getTrack,
      resolveTracks,
      isFavorite,
      toggleFavorite,
      createPlaylist,
      addTrackToPlaylists,
      uploadFiles,
      deleteLocalTrack,
      recentlyPlayed,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
}
