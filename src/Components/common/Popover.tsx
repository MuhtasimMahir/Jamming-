import { useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

interface PopoverProps {
  trigger: (props: { onClick: (e: React.MouseEvent) => void; ref: React.RefObject<HTMLButtonElement | null> }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'start' | 'end';
}

export function Popover({ trigger, children, align = 'end' }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const close = () => setIsOpen(false);
  useOnClickOutside(contentRef, close, isOpen);

  const open = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: align === 'end' ? rect.right + window.scrollX : rect.left + window.scrollX,
      });
    }
    setIsOpen(true);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) close();
    else open();
  };

  return (
    <>
      {trigger({ onClick: handleTriggerClick, ref: triggerRef })}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={contentRef}
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.1 } }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                top: coords.top,
                left: align === 'end' ? coords.left : coords.left,
                transform: align === 'end' ? 'translateX(-100%)' : undefined,
              }}
              className="z-[70] min-w-[200px] rounded-[var(--radius-md)] border border-border bg-surface-raised p-1.5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {children(close)}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

export function PopoverItem({
  icon,
  children,
  onClick,
  variant = 'default',
}: {
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover ${
        variant === 'danger' ? 'text-danger-text' : 'text-text-primary'
      }`}
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}
