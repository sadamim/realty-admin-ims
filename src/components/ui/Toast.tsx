'use client';

// Toast + notification system.
// One provider does two jobs: it shows transient toasts, and it keeps the last
// 20 of them as the feed behind the header's bell — so the notifications panel
// only ever shows things that actually happened in this session.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCheckCircle,
  IconClose,
  IconInfo,
} from '@/components/icons';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

export interface ToastInput {
  kind?: ToastKind;
  title: string;
  description?: string;
  /** Milliseconds on screen. Defaults to 4500 (7000 for errors). */
  duration?: number;
}

export interface ToastRecord extends Required<Pick<ToastInput, 'title'>> {
  id: string;
  kind: ToastKind;
  description?: string;
  at: number;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
  notifications: ToastRecord[];
  unread: number;
  markAllRead: () => void;
  clearNotifications: () => void;
}

const noop = () => {};

const ToastContext = createContext<ToastContextValue>({
  toast: noop,
  notifications: [],
  unread: 0,
  markAllRead: noop,
  clearNotifications: noop,
});

export function useToast() {
  return useContext(ToastContext).toast;
}

export function useNotifications() {
  const { notifications, unread, markAllRead, clearNotifications } = useContext(ToastContext);
  return { notifications, unread, markAllRead, clearNotifications };
}

const MAX_LOG = 20;

interface LiveToast extends ToastRecord {
  leaving: boolean;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [live, setLive] = useState<LiveToast[]>([]);
  const [log, setLog] = useState<ToastRecord[]>([]);
  const [unread, setUnread] = useState(0);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const drop = useCallback((id: string) => {
    setLive((current) => current.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    const timeout = setTimeout(() => {
      setLive((current) => current.filter((t) => t.id !== id));
      timers.current.delete(`exit-${id}`);
    }, 220);
    timers.current.set(`exit-${id}`, timeout);
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const kind: ToastKind = input.kind ?? 'info';
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      const record: ToastRecord = {
        id,
        kind,
        title: input.title,
        description: input.description,
        at: Date.now(),
      };

      setLive((current) => [...current.slice(-3), { ...record, leaving: false }]);
      setLog((current) => [record, ...current].slice(0, MAX_LOG));
      setUnread((n) => Math.min(99, n + 1));

      const duration = input.duration ?? (kind === 'error' ? 7000 : 4500);
      const timeout = setTimeout(() => drop(id), duration);
      timers.current.set(id, timeout);
    },
    [drop],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      notifications: log,
      unread,
      markAllRead: () => setUnread(0),
      clearNotifications: () => {
        setLog([]);
        setUnread(0);
      },
    }),
    [toast, log, unread],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4
                   sm:inset-x-auto sm:right-0 sm:top-0 sm:items-end sm:p-5"
      >
        {live.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => drop(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const TONE: Record<ToastKind, { ring: string; icon: string; Icon: typeof IconInfo }> = {
  success: { ring: 'border-emerald-200', icon: 'text-emerald-600', Icon: IconCheckCircle },
  error: { ring: 'border-brand-100', icon: 'text-brand', Icon: IconAlertCircle },
  warning: { ring: 'border-amber-200', icon: 'text-amber-600', Icon: IconAlertTriangle },
  info: { ring: 'border-navy-200', icon: 'text-navy-600', Icon: IconInfo },
};

function ToastCard({ toast, onClose }: { toast: LiveToast; onClose: () => void }) {
  const tone = TONE[toast.kind];
  const Icon = tone.Icon;

  return (
    <div
      role={toast.kind === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white p-3.5
                  shadow-pop transition duration-200 ease-smooth ${tone.ring} ${
                    toast.leaving
                      ? 'translate-y-1 scale-[0.98] opacity-0'
                      : 'animate-toast-in translate-y-0 scale-100 opacity-100'
                  }`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone.icon}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-[13px] leading-snug text-slate-500">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="-m-1 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <IconClose className="h-4 w-4" />
      </button>
    </div>
  );
}
