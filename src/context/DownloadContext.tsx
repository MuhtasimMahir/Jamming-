import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { DownloadJob, ExportManifestFormat, Playlist, Track } from '@/types';
import { createId } from '@/lib/id';
import { downloadLocalTrack, exportPlaylistAsZip, triggerBlobDownload } from '@/lib/exportPlaylist';
import { useToast } from './ToastContext';

interface DownloadContextValue {
  jobs: DownloadJob[];
  downloadTrack: (track: Track) => Promise<void>;
  downloadPlaylist: (playlist: Playlist, tracks: Track[], format: ExportManifestFormat) => Promise<void>;
  clearFinished: () => void;
}

const DownloadContext = createContext<DownloadContextValue | null>(null);

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const { showToast } = useToast();

  const updateJob = useCallback((id: string, patch: Partial<DownloadJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const downloadTrack = useCallback(
    async (track: Track) => {
      if (track.source !== 'local') {
        showToast({
          variant: 'info',
          title: "Spotify tracks can't be downloaded",
          description: 'Spotify\'s terms forbid saving audio from the platform. Open it in Spotify to play the full song.',
        });
        return;
      }
      const id = createId();
      setJobs((prev) => [
        { id, label: track.name, kind: 'track', status: 'preparing', progress: 20, createdAt: Date.now() },
        ...prev,
      ]);
      try {
        await downloadLocalTrack(track);
        updateJob(id, { status: 'done', progress: 100, fileName: track.fileName, sizeBytes: track.fileSizeBytes });
      } catch (err) {
        updateJob(id, { status: 'error', errorMessage: err instanceof Error ? err.message : 'Download failed' });
        showToast({ variant: 'error', title: 'Download failed', description: track.name });
      }
    },
    [showToast, updateJob],
  );

  const downloadPlaylist = useCallback(
    async (playlist: Playlist, tracks: Track[], format: ExportManifestFormat) => {
      if (tracks.length === 0) {
        showToast({ variant: 'warning', title: 'Nothing to download', description: 'Add some tracks to this playlist first.' });
        return;
      }
      const id = createId();
      setJobs((prev) => [
        { id, label: playlist.name, kind: 'playlist', status: 'zipping', progress: 0, createdAt: Date.now() },
        ...prev,
      ]);
      try {
        const result = await exportPlaylistAsZip(playlist, tracks, format, (percent) => updateJob(id, { progress: percent }));
        triggerBlobDownload(result.blob, result.fileName);
        updateJob(id, { status: 'done', progress: 100, fileName: result.fileName, sizeBytes: result.blob.size });
        if (result.spotifyOnlyCount > 0) {
          showToast({
            variant: 'info',
            title: `${result.fileName} downloaded`,
            description: `${result.localFileCount} audio file(s) included. ${result.spotifyOnlyCount} Spotify track(s) are listed as links only.`,
          });
        }
      } catch (err) {
        updateJob(id, { status: 'error', errorMessage: err instanceof Error ? err.message : 'Export failed' });
        showToast({ variant: 'error', title: 'Export failed', description: playlist.name });
      }
    },
    [showToast, updateJob],
  );

  const clearFinished = useCallback(() => {
    setJobs((prev) => prev.filter((j) => j.status !== 'done' && j.status !== 'error'));
  }, []);

  const value = useMemo(
    () => ({ jobs, downloadTrack, downloadPlaylist, clearFinished }),
    [jobs, downloadTrack, downloadPlaylist, clearFinished],
  );

  return <DownloadContext.Provider value={value}>{children}</DownloadContext.Provider>;
}

export function useDownloads(): DownloadContextValue {
  const ctx = useContext(DownloadContext);
  if (!ctx) throw new Error('useDownloads must be used within DownloadProvider');
  return ctx;
}
