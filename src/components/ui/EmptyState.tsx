import Link from 'next/link';
import type { IconProps } from '@/components/icons';
import { IconInbox } from '@/components/icons';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: (props: IconProps) => React.ReactElement;
  actionLabel?: string;
  actionHref?: string;
  compact?: boolean;
}

export default function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  actionHref,
  compact = false,
}: EmptyStateProps) {
  const Icon = icon ?? IconInbox;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'px-6 py-10' : 'px-6 py-16'
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-ghost btn-sm mt-5">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
