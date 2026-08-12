import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { handleAuthCallback } from '@/lib/spotify';
import { useSpotifyAuth } from '@/context/SpotifyAuthContext';
import { Button } from '@/components/common/Button';

export function CallbackPage() {
  const navigate = useNavigate();
  const { refresh } = useSpotifyAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleAuthCallback()
      .then(() => {
        refresh();
        navigate('/', { replace: true });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Sign-in failed.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      {error ? (
        <>
          <AlertCircle size={28} className="text-danger-text" />
          <p className="text-sm text-text-secondary">{error}</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </>
      ) : (
        <>
          <Loader2 size={28} className="animate-spin text-accent" />
          <p className="text-sm text-text-secondary">Connecting to Spotify…</p>
        </>
      )}
    </div>
  );
}
