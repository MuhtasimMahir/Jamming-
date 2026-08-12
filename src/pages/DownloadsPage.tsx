import { CheckCircle2, AlertCircle, Loader2, Download as DownloadIcon, Music2, ListMusic, Trash2 } from 'lucide-react';
import { useDownloads } from '@/context/DownloadContext';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { formatBytes, formatRelativeTime } from '@/lib/format';
import type { DownloadJob } from '@/types';

function StatusIcon({ status }: { status: DownloadJob['status'] }) {
  if (status === 'done') return <CheckCircle2 size={18} className="text-success" />;
  if (status === 'error') return <AlertCircle size={18} className="text-danger-text" />;
  return <Loader2 size={18} className="animate-spin text-accent-text" />;
}

export function DownloadsPage() {
  const { jobs, clearFinished } = useDownloads();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">Downloads</h1>
        {jobs.some((j) => j.status === 'done' || j.status === 'error') && (
          <Button variant="ghost" size="sm" leftIcon={<Trash2 size={14} />} onClick={clearFinished}>
            Clear finished
          </Button>
        )}
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={<DownloadIcon size={22} />}
          title="Nothing downloaded yet"
          description="Download individual tracks from your Local Library, or export a whole playlist as a zip from its Download button. Spotify tracks stay on Spotify — their terms don't allow saving audio from the platform."
        />
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-[var(--radius-md)] border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-surface-hover text-text-tertiary">
                  {job.kind === 'playlist' ? <ListMusic size={16} /> : <Music2 size={16} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{job.label}</p>
                  <p className="truncate text-xs text-text-tertiary">
                    {job.status === 'error'
                      ? job.errorMessage
                      : job.status === 'done'
                        ? `${job.fileName ?? ''} · ${formatBytes(job.sizeBytes)} · ${formatRelativeTime(job.createdAt)}`
                        : job.status === 'zipping'
                          ? 'Zipping…'
                          : 'Preparing…'}
                  </p>
                </div>
                <StatusIcon status={job.status} />
              </div>
              {(job.status === 'preparing' || job.status === 'zipping') && (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-200"
                    style={{ width: `${Math.max(4, job.progress)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
