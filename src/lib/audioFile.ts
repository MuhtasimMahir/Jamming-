import type { LocalTrack } from '@/types';
import { createId } from './id';
import { saveAudioBlob } from './db';

export const ACCEPTED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/x-m4a', 'audio/mp4', 'audio/aac'];

export function isAudioFile(file: File): boolean {
  if (file.type && ACCEPTED_AUDIO_TYPES.some((t) => file.type === t || file.type.startsWith('audio/'))) return true;
  return /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(file.name);
}

function readDurationMs(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const cleanup = () => URL.revokeObjectURL(url);
    audio.addEventListener('loadedmetadata', () => {
      const ms = Number.isFinite(audio.duration) ? audio.duration * 1000 : null;
      cleanup();
      resolve(ms);
    });
    audio.addEventListener('error', () => {
      cleanup();
      resolve(null);
    });
    audio.src = url;
  });
}

/** Splits "Artist - Title.mp3" into parts when the filename follows that
 * common convention; otherwise falls back to the whole name as the title. */
function guessNameAndArtist(fileName: string): { name: string; artist: string } {
  const withoutExt = fileName.replace(/\.[^.]+$/, '');
  const match = withoutExt.match(/^(.+?)\s*-\s*(.+)$/);
  if (match) return { artist: match[1].trim(), name: match[2].trim() };
  return { name: withoutExt.trim(), artist: 'Unknown artist' };
}

export async function createLocalTrackFromFile(file: File): Promise<LocalTrack> {
  const blobKey = `local-${createId()}`;
  const [durationMs] = await Promise.all([readDurationMs(file), saveAudioBlob(blobKey, file)]);
  const { name, artist } = guessNameAndArtist(file.name);

  return {
    id: `local:${blobKey}`,
    source: 'local',
    blobKey,
    name,
    artist,
    album: 'Local files',
    durationMs,
    artworkUrl: null,
    fileName: file.name,
    mimeType: file.type || 'audio/mpeg',
    fileSizeBytes: file.size,
    addedAt: Date.now(),
  };
}
