import { Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useSpotifyAuth } from '@/context/SpotifyAuthContext';
import { Switch } from '@/components/common/Switch';
import { Button } from '@/components/common/Button';
import { Popover, PopoverItem } from '@/components/common/Popover';
import { Wordmark } from './Wordmark';
import { useIsMobile } from '@/hooks/useMediaQuery';

export function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const { isConfigured, isLoggedIn, profile, isConnecting, login, logout } = useSpotifyAuth();
  const isMobile = useIsMobile();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-canvas px-4 sm:px-6">
      {isMobile ? <Wordmark compact /> : <div />}

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Sun size={15} className="text-text-tertiary" aria-hidden />
          <Switch checked={theme === 'dark'} onChange={toggleTheme} label="Toggle dark mode" />
          <Moon size={15} className="text-text-tertiary" aria-hidden />
        </div>

        {isConfigured &&
          (isLoggedIn ? (
            <Popover
              align="end"
              trigger={({ onClick, ref }) => (
                <button ref={ref} onClick={onClick} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-surface-hover">
                  <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-accent-wash text-xs font-semibold text-accent-text">
                    {profile?.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (profile?.displayName ?? 'S')[0].toUpperCase()
                    )}
                  </span>
                  <span className="hidden max-w-[10ch] truncate text-sm font-medium text-text-primary sm:inline">
                    {profile?.displayName ?? 'Spotify'}
                  </span>
                </button>
              )}
            >
              {(close) => (
                <PopoverItem
                  icon={<LogOut size={16} />}
                  variant="danger"
                  onClick={() => {
                    logout();
                    close();
                  }}
                >
                  Disconnect Spotify
                </PopoverItem>
              )}
            </Popover>
          ) : (
            <Button size="sm" variant="outline" isLoading={isConnecting} onClick={login}>
              Connect Spotify
            </Button>
          ))}
      </div>
    </header>
  );
}
