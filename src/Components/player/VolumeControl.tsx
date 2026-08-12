import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { RangeSlider } from './RangeSlider';

export function VolumeControl() {
  const { volume, muted, toggleMute, setVolume } = usePlayer();
  const effective = muted ? 0 : volume;
  const Icon = effective === 0 ? VolumeX : effective < 0.35 ? Volume : effective < 0.7 ? Volume1 : Volume2;

  return (
    <div className="group/vol flex w-10 items-center gap-2 transition-all duration-200 hover:w-32 focus-within:w-32">
      <button
        onClick={toggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        className="shrink-0 text-text-tertiary transition-colors hover:text-text-primary"
      >
        <Icon size={18} />
      </button>
      <div className="w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover/vol:w-full group-hover/vol:opacity-100 group-focus-within/vol:w-full group-focus-within/vol:opacity-100">
        <RangeSlider value={effective} max={1} step={0.01} onChange={setVolume} ariaLabel="Volume" />
      </div>
    </div>
  );
}
