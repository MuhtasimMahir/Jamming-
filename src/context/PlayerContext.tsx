import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { RepeatMode, Track } from '@/types';
import { getAudioBlob } from '@/lib/db';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';
import { useLibrary } from './LibraryContext';
import { useToast } from './ToastContext';

export function isPlayableTrack(track: Track): boolean {
  if (track.source === 'local') return true;
  return Boolean(track.previewUrl);
}

function shuffledOrder(length: number, keepFirstIndex: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const pos = indices.indexOf(keepFirstIndex);
  if (pos > 0) {
    indices.splice(pos, 1);
    indices.unshift(keepFirstIndex);
  }
  return indices;
}

// ---------------------------------------------------------------------------
// Queue reducer — queue/order/position always change together, atomically.
// Keeping them in one reducer (rather than three useState calls) avoids
// stale-closure bugs when actions like "add to queue" fire back to back.
// ---------------------------------------------------------------------------

interface QueueState {
  queue: Track[];
  order: number[]; // permutation of indices into `queue`, i.e. play order
  position: number; // index into `order`
}

const emptyQueueState: QueueState = { queue: [], order: [], position: 0 };

type QueueAction =
  | { type: 'SET'; queue: Track[]; order: number[]; position: number }
  | { type: 'MOVE'; position: number }
  | { type: 'SET_ORDER'; order: number[]; position: number }
  | { type: 'ENQUEUE_NEXT'; track: Track }
  | { type: 'ENQUEUE_LAST'; track: Track }
  | { type: 'REMOVE'; trackId: string }
  | { type: 'REORDER_UPCOMING'; ids: string[] };

function queueReducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case 'SET':
      return { queue: action.queue, order: action.order, position: action.position };

    case 'MOVE':
      return { ...state, position: action.position };

    case 'SET_ORDER':
      return { ...state, order: action.order, position: action.position };

    case 'ENQUEUE_NEXT': {
      const newIndex = state.queue.length;
      const order = [...state.order];
      order.splice(state.position + 1, 0, newIndex);
      return { queue: [...state.queue, action.track], order, position: state.position };
    }

    case 'ENQUEUE_LAST': {
      const newIndex = state.queue.length;
      return { queue: [...state.queue, action.track], order: [...state.order, newIndex], position: state.position };
    }

    case 'REMOVE': {
      const queueIndex = state.queue.findIndex((t) => t.id === action.trackId);
      if (queueIndex === -1) return state;
      const currentQueueIndex = state.order[state.position];
      const order = state.order.filter((i) => i !== queueIndex);
      const position =
        currentQueueIndex === queueIndex
          ? Math.min(state.position, Math.max(order.length - 1, 0))
          : Math.max(order.indexOf(currentQueueIndex), 0);
      return { ...state, order, position };
    }

    case 'REORDER_UPCOMING': {
      const idToQueueIndex = new Map(state.queue.map((t, i) => [t.id, i]));
      const head = state.order.slice(0, state.position + 1);
      const tail = action.ids.map((id) => idToQueueIndex.get(id)).filter((i): i is number => i !== undefined);
      return { ...state, order: [...head, ...tail] };
    }

    default:
      return state;
  }
}

interface PlayerContextValue {
  currentTrack: Track | null;
  queueList: Track[];
  upNext: Track[];
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  canAnalyze: boolean;
  getAnalyser: () => AnalyserNode | null;
  playNow: (track: Track, context?: Track[]) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  enqueueNext: (track: Track) => void;
  enqueueLast: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  reorderUpcoming: (newUpcomingIds: string[]) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { recordPlay } = useLibrary();
  const { showToast } = useToast();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (!audioRef.current) {
    audioRef.current = new Audio();
    audioRef.current.crossOrigin = 'anonymous';
    audioRef.current.preload = 'metadata';
  }
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const loadTokenRef = useRef(0);

  const [{ queue, order, position }, dispatchQueue] = useReducer(queueReducer, emptyQueueState);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(() => loadJSON(STORAGE_KEYS.volume, 0.85));
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [canAnalyze, setCanAnalyze] = useState(false);

  const currentTrack = useMemo<Track | null>(() => {
    if (queue.length === 0) return null;
    return queue[order[position]] ?? null;
  }, [queue, order, position]);

  const queueList = useMemo(() => order.map((i) => queue[i]).filter(Boolean), [order, queue]);
  const upNext = useMemo(() => queueList.slice(position + 1), [queueList, position]);

  const ensureAudioGraph = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        const Ctx =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        const source = ctx.createMediaElementSource(audioRef.current!);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        audioContextRef.current = ctx;
        analyserRef.current = analyser;
      } catch {
        // Web Audio unsupported — playback still works, visualizer just won't.
      }
    }
    audioContextRef.current?.resume().catch(() => undefined);
  }, []);

  // --- load whichever track is "current" into the audio element ---
  useEffect(() => {
    const audio = audioRef.current!;
    const token = ++loadTokenRef.current;

    if (!currentTrack) {
      audio.pause();
      audio.removeAttribute('src');
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    if (!isPlayableTrack(currentTrack)) {
      showToast({
        variant: 'warning',
        title: 'No preview available',
        description: `Spotify didn't provide a preview for "${currentTrack.name}". Open it in Spotify instead.`,
      });
      return;
    }

    setIsLoading(true);
    setCanAnalyze(false);

    (async () => {
      let url: string | null = null;
      if (currentTrack.source === 'local') {
        const blob = await getAudioBlob(currentTrack.blobKey);
        if (blob) url = URL.createObjectURL(blob);
      } else {
        url = currentTrack.previewUrl;
      }
      if (token !== loadTokenRef.current) return; // a newer load superseded this one
      if (!url) {
        setIsLoading(false);
        showToast({ variant: 'error', title: 'Could not load track', description: currentTrack.name });
        return;
      }
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = currentTrack.source === 'local' ? url : null;

      audio.src = url;
      try {
        ensureAudioGraph();
        await audio.play();
        recordPlay(currentTrack.id);
      } catch {
        // Autoplay may be blocked before the first user gesture; the UI stays
        // paused and the person can press play to try again.
        setIsPlaying(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  const advance = useCallback(
    (direction: 1 | -1) => {
      if (queue.length === 0) return;
      let next = position + direction;
      for (let attempts = 0; attempts < order.length; attempts++) {
        if (next < 0) {
          if (repeat === 'all') next = order.length - 1;
          else return; // already at the start, not repeating — stay put
        }
        if (next >= order.length) {
          if (repeat === 'all') next = 0;
          else {
            setIsPlaying(false);
            return; // reached the end, not repeating — stop
          }
        }
        const candidate = queue[order[next]];
        if (candidate && isPlayableTrack(candidate)) {
          dispatchQueue({ type: 'MOVE', position: next });
          return;
        }
        next += direction;
      }
    },
    [queue, order, position, repeat],
  );

  const next = useCallback(() => advance(1), [advance]);
  const previous = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    advance(-1);
  }, [advance]);

  // --- audio element event wiring (attached once) ---
  useEffect(() => {
    const audio = audioRef.current!;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => undefined);
      } else {
        advance(1);
      }
    };
    const onError = () => {
      setIsLoading(false);
      if (audio.src) advance(1);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [repeat, advance]);

  // --- empirically detect whether the analyser is getting real signal ---
  // (guards against CORS-tainted cross-origin audio silently zeroing the data)
  useEffect(() => {
    if (!isPlaying) return;
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    let rafId: number;
    let framesChecked = 0;
    let sawSignal = false;
    const check = () => {
      analyser.getByteFrequencyData(data);
      if (data.some((v) => v > 2)) sawSignal = true;
      framesChecked += 1;
      if (framesChecked < 20 && !sawSignal) {
        rafId = requestAnimationFrame(check);
      } else {
        setCanAnalyze(sawSignal);
      }
    };
    rafId = requestAnimationFrame(check);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, currentTrack?.id]);

  useEffect(() => {
    audioRef.current!.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    saveJSON(STORAGE_KEYS.volume, volume);
  }, [volume]);

  const playNow = useCallback(
    (track: Track, context?: Track[]) => {
      const list = context && context.length > 0 ? context : [track];
      const startIndex = Math.max(
        list.findIndex((t) => t.id === track.id),
        0,
      );
      const order = shuffle ? shuffledOrder(list.length, startIndex) : list.map((_, i) => i);
      dispatchQueue({ type: 'SET', queue: list, order, position: order.indexOf(startIndex) });
    },
    [shuffle],
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current!;
    if (!currentTrack) return;
    if (audio.paused) {
      ensureAudioGraph();
      audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  }, [currentTrack, ensureAudioGraph]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current!;
    audio.currentTime = Math.max(0, Math.min(seconds, audio.duration || seconds));
    setCurrentTime(audio.currentTime);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const next = !prev;
      const currentQueueIndex = order[position];
      if (next) {
        dispatchQueue({ type: 'SET_ORDER', order: shuffledOrder(queue.length, currentQueueIndex), position: 0 });
      } else {
        const sequential = queue.map((_, i) => i);
        dispatchQueue({ type: 'SET_ORDER', order: sequential, position: currentQueueIndex ?? 0 });
      }
      return next;
    });
  }, [queue, order, position]);

  const cycleRepeat = useCallback(() => {
    setRepeat((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
  }, []);

  const enqueueNext = useCallback(
    (track: Track) => {
      if (!currentTrack) return playNow(track);
      dispatchQueue({ type: 'ENQUEUE_NEXT', track });
    },
    [currentTrack, playNow],
  );

  const enqueueLast = useCallback(
    (track: Track) => {
      if (!currentTrack) return playNow(track);
      dispatchQueue({ type: 'ENQUEUE_LAST', track });
    },
    [currentTrack, playNow],
  );

  const removeFromQueue = useCallback((trackId: string) => {
    dispatchQueue({ type: 'REMOVE', trackId });
  }, []);

  const reorderUpcoming = useCallback((newUpcomingIds: string[]) => {
    dispatchQueue({ type: 'REORDER_UPCOMING', ids: newUpcomingIds });
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      currentTrack,
      queueList,
      upNext,
      isPlaying,
      isLoading,
      currentTime,
      duration,
      volume,
      muted,
      shuffle,
      repeat,
      canAnalyze,
      getAnalyser: () => analyserRef.current,
      playNow,
      togglePlay,
      next,
      previous,
      seek,
      setVolume: setVolumeState,
      toggleMute: () => setMuted((m) => !m),
      toggleShuffle,
      cycleRepeat,
      enqueueNext,
      enqueueLast,
      removeFromQueue,
      reorderUpcoming,
    }),
    [
      currentTrack,
      queueList,
      upNext,
      isPlaying,
      isLoading,
      currentTime,
      duration,
      volume,
      muted,
      shuffle,
      repeat,
      canAnalyze,
      playNow,
      togglePlay,
      next,
      previous,
      seek,
      toggleShuffle,
      cycleRepeat,
      enqueueNext,
      enqueueLast,
      removeFromQueue,
      reorderUpcoming,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
