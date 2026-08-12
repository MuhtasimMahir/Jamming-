/**
 * A track's audio can come from two places:
 *  - "spotify": metadata + optional 30s preview from the Spotify Web API.
 *    Spotify's terms forbid saving/downloading this content, so these
 *    tracks are playback-only (when a preview exists) and link out to
 *    Spotify for full playback.
 *  - "local": a file the user added themselves. Fully playable, fully
 *    downloadable/exportable, since it's the user's own file.
 */
export type TrackSource = 'spotify' | 'local';

export interface BaseTrack {
  /** Namespaced unique id, e.g. "spotify:123" or "local:uuid" */
  id: string;
  source: TrackSource;
  name: string;
  artist: string;
  album: string;
  durationMs: number | null;
  artworkUrl: string | null;
  addedAt: number;
}

export interface SpotifyTrack extends BaseTrack {
  source: 'spotify';
  spotifyId: string;
  uri: string;
  externalUrl: string | null;
  previewUrl: string | null;
}

export interface LocalTrack extends BaseTrack {
  source: 'local';
  /** key into the IndexedDB blob store */
  blobKey: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
}

export type Track = SpotifyTrack | LocalTrack;

export interface Playlist {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
  /** true for the built-in "Liked Songs" playlist, which can't be deleted/renamed */
  isSystem?: boolean;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayHistoryEntry {
  trackId: string;
  playedAt: number;
}

export type DownloadJobStatus = 'preparing' | 'zipping' | 'done' | 'error';

export interface DownloadJob {
  id: string;
  label: string;
  kind: 'track' | 'playlist';
  status: DownloadJobStatus;
  progress: number; // 0-100
  createdAt: number;
  fileName?: string;
  errorMessage?: string;
  sizeBytes?: number;
}

export type ExportManifestFormat = 'm3u8' | 'json' | 'csv';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'warning' | 'info';
}
