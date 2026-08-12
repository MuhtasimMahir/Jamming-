import clsx from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-[var(--radius-sm)] bg-surface-hover', className)} aria-hidden />;
}

export function TrackRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2">
      <Skeleton className="h-10 w-10 shrink-0 rounded-[var(--radius-sm)]" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-3 w-10" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square w-full rounded-[var(--radius-md)]" />
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
