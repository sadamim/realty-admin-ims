'use client';

import { useEffect } from 'react';
import { IconAlertTriangle } from '@/components/icons';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard]', error);
  }, [error]);

  return (
    <div className="card animate-fade-up flex flex-col items-center px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand">
        <IconAlertTriangle className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-slate-900">Something went wrong</h1>
      <p className="mt-1.5 max-w-md text-sm text-slate-500">
        The page could not be loaded. This is usually a database connection problem — check that
        MONGODB_URI is set and that the deployment&apos;s IP range is allowed in Atlas.
      </p>
      {error.digest && <p className="mt-2 text-xs text-slate-400">Reference: {error.digest}</p>}
      <button type="button" onClick={reset} className="btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}
