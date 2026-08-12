import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { MiniPlayer } from '@/components/player/MiniPlayer';
import { QueuePanel } from '@/components/player/QueuePanel';
import { NowPlayingOverlay } from '@/components/player/NowPlayingOverlay';
import { ToastViewport } from '@/components/common/ToastViewport';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function AppShell() {
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const isMobile = useIsMobile();
  useKeyboardShortcuts();

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-canvas">
      {!isMobile && <Sidebar />}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <MiniPlayer onExpand={() => setNowPlayingOpen(true)} onToggleQueue={() => setQueueOpen((v) => !v)} />
        {isMobile && <MobileNav />}
      </div>

      <QueuePanel isOpen={queueOpen} onClose={() => setQueueOpen(false)} />
      <NowPlayingOverlay isOpen={nowPlayingOpen} onClose={() => setNowPlayingOpen(false)} />
      <ToastViewport />
    </div>
  );
}
