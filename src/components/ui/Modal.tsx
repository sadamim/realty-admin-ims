'use client';

// Accessible modal: Escape to close, click-outside to close, scroll lock,
// focus moved into the panel and restored on close.
// Rendered through a portal so it is never trapped by an animated (and
// therefore transformed) page wrapper.
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconClose } from '@/components/icons';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Hide the × in the header (e.g. while a destructive action is running). */
  hideClose?: boolean;
}

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
} as const;

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  hideClose = false,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      restoreTo.current = document.activeElement as HTMLElement | null;
      setRender(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = setTimeout(() => setRender(false), 200);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!render) return;
    const { style } = document.body;
    const previous = style.overflow;
    style.overflow = 'hidden';
    return () => {
      style.overflow = previous;
    };
  }, [render]);

  useEffect(() => {
    if (!visible) return;
    panelRef.current?.focus();
    return () => {
      restoreTo.current?.focus?.();
    };
  }, [visible]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  if (!mounted || !render) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6"
      onKeyDown={onKeyDown}
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-200 ease-smooth ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rf-modal-title"
        tabIndex={-1}
        className={`relative break-words [overflow-wrap:anywhere] max-h-[100dvh] overflow-y-auto overscroll-contain sm:max-h-[calc(100dvh-3rem)] w-full ${SIZES[size]} rounded-t-2xl bg-white shadow-pop outline-none
                    transition duration-200 ease-smooth sm:rounded-2xl ${
                      visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-[0.98] opacity-0'
                    }`}
      >
        <div className="flex items-start gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 id="rf-modal-title" className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          {!hideClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="-mr-1 -mt-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <IconClose className="h-5 w-5" />
            </button>
          )}
        </div>

        {children && <div className="px-5 py-4 sm:px-6">{children}</div>}

        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
