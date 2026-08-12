import type { ExportManifestFormat, Playlist, Track } from '@/types';
import { getAudioBlob } from './db';
import { formatDuration } from './format';

export function isLocalTrack(track: Track): track is Track & { source: 'local' } {
  return track.source === 'local';
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'untitled';
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser a moment to pick up the blob URL before revoking it.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Downloads a single local track's original file. Only local tracks are
 * downloadable — see the note in lib/spotify.ts on why Spotify-sourced
 * tracks never get a download action. */
export async function downloadLocalTrack(track: Extract<Track, { source: 'local' }>): Promise<void> {
  const blob = await getAudioBlob(track.blobKey);
  if (!blob) throw new Error('That file is no longer available in this browser.');
  triggerBlobDownload(blob, track.fileName);
}

function buildM3U(tracks: Track[]): string {
  const lines = ['#EXTM3U'];
  for (const t of tracks) {
    const seconds = t.durationMs ? Math.round(t.durationMs / 1000) : -1;
    lines.push(`#EXTINF:${seconds},${t.artist} - ${t.name}`);
    if (t.source === 'local') {
      lines.push(`audio/${sanitizeFileName(t.fileName)}`);
    } else {
      lines.push(`# Spotify preview only in-app — open in Spotify:`);
      lines.push(t.externalUrl ?? `spotify:track:${t.spotifyId}`);
    }
  }
  return lines.join('\n');
}

function buildJSON(playlist: Playlist, tracks: Track[]): string {
  return JSON.stringify(
    {
      name: playlist.name,
      description: playlist.description,
      exportedAt: new Date().toISOString(),
      trackCount: tracks.length,
      tracks: tracks.map((t) => ({
        name: t.name,
        artist: t.artist,
        album: t.album,
        durationMs: t.durationMs,
        source: t.source,
        ...(t.source === 'local'
          ? { file: `audio/${sanitizeFileName(t.fileName)}` }
          : { spotifyUrl: t.externalUrl, spotifyUri: t.uri }),
      })),
    },
    null,
    2,
  );
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function buildCSV(tracks: Track[]): string {
  const header = ['Name', 'Artist', 'Album', 'Duration', 'Source', 'Link or File'];
  const rows = tracks.map((t) => [
    t.name,
    t.artist,
    t.album,
    formatDuration(t.durationMs),
    t.source,
    t.source === 'local' ? `audio/${sanitizeFileName(t.fileName)}` : (t.externalUrl ?? ''),
  ]);
  return [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}

function manifestFile(format: ExportManifestFormat, playlist: Playlist, tracks: Track[]): { name: string; content: string } {
  if (format === 'json') return { name: 'playlist.json', content: buildJSON(playlist, tracks) };
  if (format === 'csv') return { name: 'playlist.csv', content: buildCSV(tracks) };
  return { name: 'playlist.m3u8', content: buildM3U(tracks) };
}

export interface PlaylistExportResult {
  blob: Blob;
  fileName: string;
  localFileCount: number;
  spotifyOnlyCount: number;
}

/**
 * Builds a zip containing the user's own local audio files plus a manifest
 * (M3U/JSON/CSV) covering every track, including Spotify-sourced ones as
 * reference links. Progress is reported 0-100 via onProgress.
 */
export async function exportPlaylistAsZip(
  playlist: Playlist,
  tracks: Track[],
  format: ExportManifestFormat,
  onProgress?: (percent: number) => void,
): Promise<PlaylistExportResult> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const audioFolder = zip.folder('audio');
  const localTracks = tracks.filter(isLocalTrack);
  const spotifyOnlyCount = tracks.length - localTracks.length;

  let loaded = 0;
  for (const track of localTracks) {
    const blob = await getAudioBlob(track.blobKey);
    if (blob) audioFolder?.file(sanitizeFileName(track.fileName), blob);
    loaded += 1;
    onProgress?.(Math.round((loaded / Math.max(localTracks.length, 1)) * 40));
  }

  const manifest = manifestFile(format, playlist, tracks);
  zip.file(manifest.name, manifest.content);
  zip.file(
    'README.txt',
    [
      `${playlist.name}`,
      '',
      `${localTracks.length} local file(s) included in /audio.`,
      spotifyOnlyCount > 0
        ? `${spotifyOnlyCount} track(s) came from Spotify search and aren't included as audio — Spotify's terms don't allow` +
          ' downloading their content. Open the links in the manifest to play them in Spotify.'
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
  );

  const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }, (metadata) => {
    onProgress?.(40 + Math.round(metadata.percent * 0.6));
  });

  return {
    blob: content,
    fileName: `${sanitizeFileName(playlist.name)}.zip`,
    localFileCount: localTracks.length,
    spotifyOnlyCount,
  };
}
