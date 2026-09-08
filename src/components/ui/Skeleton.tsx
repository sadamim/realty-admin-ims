export default function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

/** Placeholder rows that mirror the real table layout. */
export function SkeletonTable({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-wrap">
      <div className="flex gap-4 bg-slate-50/80 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-t border-slate-100 px-4 py-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-3.5 flex-1 ${c === 0 ? 'max-w-[220px]' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="mt-4 h-7 w-24" />
          <Skeleton className="mt-2.5 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPageHeader() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <Skeleton className="h-7 w-44" />
        <Skeleton className="mt-2.5 h-3.5 w-72" />
      </div>
      <Skeleton className="h-10 w-64 rounded-lg" />
    </div>
  );
}
