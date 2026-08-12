import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '@/context/PlayerContext';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

/** Wired once near the app root. Space/arrows/shortcuts mirror common media
 * player conventions (YouTube, Spotify web) so they feel familiar. */
export function useKeyboardShortcuts(): void {
  const player = usePlayer();
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.key) {
        case ' ':
          event.preventDefault();
          player.togglePlay();
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (event.shiftKey) player.next();
          else player.seek(player.currentTime + 5);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (event.shiftKey) player.previous();
          else player.seek(player.currentTime - 5);
          break;
        case 'ArrowUp':
          event.preventDefault();
          player.setVolume(Math.min(1, player.volume + 0.05));
          break;
        case 'ArrowDown':
          event.preventDefault();
          player.setVolume(Math.max(0, player.volume - 0.05));
          break;
        case 'm':
        case 'M':
          player.toggleMute();
          break;
        case 's':
        case 'S':
          player.toggleShuffle();
          break;
        case 'r':
        case 'R':
          player.cycleRepeat();
          break;
        case '/':
          event.preventDefault();
          navigate('/search');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [player, navigate]);
}
