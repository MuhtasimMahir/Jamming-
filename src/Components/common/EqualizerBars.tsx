import clsx from 'clsx';

interface EqualizerBarsProps {
  animate?: boolean;
  className?: string;
  barClassName?: string;
}

/** Three bars that idle at rest and bounce like a level meter while
 * `animate` is true. Doubles as the "zZz" wordmark treatment and as a
 * per-row now-playing indicator in track lists. */
export function EqualizerBars({ animate = true, className, barClassName }: EqualizerBarsProps) {
  const delays = ['0ms', '160ms', '320ms'];
  return (
    <span className={clsx('inline-flex h-3.5 items-end gap-[2.5px]', className)} aria-hidden>
      {delays.map((delay, i) => (
        <span
          key={i}
          className={clsx('w-[3px] origin-bottom rounded-full bg-current', animate ? 'animate-eq' : '', barClassName)}
          style={{ height: '100%', animationDelay: delay, transform: animate ? undefined : 'scaleY(0.4)' }}
        />
      ))}
    </span>
  );
}
