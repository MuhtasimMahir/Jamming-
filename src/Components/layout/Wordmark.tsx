import { AnimatePresence, motion } from 'framer-motion';
import { EqualizerBars } from '@/components/common/EqualizerBars';
import { usePlayer } from '@/context/PlayerContext';

export function Wordmark({ compact = false }: { compact?: boolean }) {
  const { isPlaying } = usePlayer();

  return (
    <span className={`font-display font-bold tracking-tight text-text-primary ${compact ? 'text-xl' : 'text-2xl'}`}>
      Jam
      <span className="relative mx-px inline-flex h-[1em] w-[1.6em] items-center justify-center align-middle text-accent">
        <AnimatePresence mode="wait" initial={false}>
          {isPlaying ? (
            <motion.span
              key="eq"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <EqualizerBars animate className="h-[0.85em]" />
            </motion.span>
          ) : (
            <motion.span
              key="text"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              zZz
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      List
    </span>
  );
}
