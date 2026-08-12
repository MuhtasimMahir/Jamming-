import { Download, FileJson, FileSpreadsheet, ListMusic } from 'lucide-react';
import { Popover, PopoverItem } from '@/components/common/Popover';
import { Button } from '@/components/common/Button';
import { useDownloads } from '@/context/DownloadContext';
import type { ExportManifestFormat, Playlist, Track } from '@/types';

export function DownloadPlaylistButton({ playlist, tracks }: { playlist: Playlist; tracks: Track[] }) {
  const { downloadPlaylist } = useDownloads();

  const handlePick = (format: ExportManifestFormat) => downloadPlaylist(playlist, tracks, format);

  return (
    <Popover
      align="start"
      trigger={({ onClick, ref }) => (
        <Button
          ref={ref as unknown as React.Ref<HTMLButtonElement>}
          onClick={onClick}
          variant="outline"
          size="md"
          leftIcon={<Download size={16} />}
          disabled={tracks.length === 0}
        >
          Download
        </Button>
      )}
    >
      {(close) => (
        <>
          <p className="px-3 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Manifest format</p>
          <PopoverItem
            icon={<ListMusic size={16} />}
            onClick={() => {
              handlePick('m3u8');
              close();
            }}
          >
            M3U8 playlist
          </PopoverItem>
          <PopoverItem
            icon={<FileJson size={16} />}
            onClick={() => {
              handlePick('json');
              close();
            }}
          >
            JSON
          </PopoverItem>
          <PopoverItem
            icon={<FileSpreadsheet size={16} />}
            onClick={() => {
              handlePick('csv');
              close();
            }}
          >
            CSV
          </PopoverItem>
        </>
      )}
    </Popover>
  );
}
