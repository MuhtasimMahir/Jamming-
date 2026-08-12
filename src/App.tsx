import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { LibraryProvider } from '@/context/LibraryContext';
import { PlayerProvider } from '@/context/PlayerContext';
import { DownloadProvider } from '@/context/DownloadContext';
import { SpotifyAuthProvider } from '@/context/SpotifyAuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { HomePage } from '@/pages/HomePage';
import { SearchPage } from '@/pages/SearchPage';
import { PlaylistPage } from '@/pages/PlaylistPage';
import { LibraryPage } from '@/pages/LibraryPage';
import { DownloadsPage } from '@/pages/DownloadsPage';
import { CallbackPage } from '@/pages/CallbackPage';

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SpotifyAuthProvider>
          <LibraryProvider>
            <PlayerProvider>
              <DownloadProvider>{children}</DownloadProvider>
            </PlayerProvider>
          </LibraryProvider>
        </SpotifyAuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Providers>
        <Routes>
          <Route path="/callback" element={<CallbackPage />} />
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="downloads" element={<DownloadsPage />} />
            <Route path="playlist/:id" element={<PlaylistPage />} />
          </Route>
        </Routes>
      </Providers>
    </BrowserRouter>
  );
}
