import clsx from 'clsx';

interface RangeSliderProps {
  value: number;
  min?: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  alwaysShowThumb?: boolean;
  className?: string;
}

export function RangeSlider({ value, min = 0, max, step = 0.1, onChange, ariaLabel, alwaysShowThumb, className }: RangeSliderProps) {
  const progress = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={ariaLabel}
      className={clsx('range-slider', alwaysShowThumb && 'always-show-thumb', className)}
      style={{ ['--range-progress' as string]: `${progress}%` }}
    />
  );
}
