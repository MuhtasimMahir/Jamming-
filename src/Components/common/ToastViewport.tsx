import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import type { ToastMessage } from '@/types';

const icons: Record<ToastMessage['variant'], typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorClasses: Record<ToastMessage['variant'], string> = {
  success: 'text-success',
  error: 'text-danger-text',
  warning: 'text-warning',
  info: 'text-accent-text',
};

export function ToastViewport() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:top-6">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = icons[toast.variant];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.12 } }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-md)] border border-border bg-surface-raised p-3.5 shadow-2xl"
              role="status"
            >
              <Icon size={18} className={`mt-0.5 shrink-0 ${colorClasses[toast.variant]}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">{toast.title}</p>
                {toast.description && <p className="mt-0.5 text-sm text-text-secondary">{toast.description}</p>}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-full p-1 text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
