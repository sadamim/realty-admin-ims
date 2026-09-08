// A plain GET form — no client JS needed, and the search term stays in the URL
// so results are shareable and survive a refresh.
//
// `keep` carries the other active query params (the project-type filter, for
// example) through the submit, so searching no longer silently drops them.
import Link from 'next/link';
import { IconClose, IconSearch } from '@/components/icons';

export default function SearchBox({
  action,
  defaultValue,
  placeholder = 'Search…',
  keep = {},
  className = '',
}: {
  action: string;
  defaultValue?: string;
  placeholder?: string;
  keep?: Record<string, string | undefined>;
  className?: string;
}) {
  const entries = Object.entries(keep).filter(([, value]) => Boolean(value)) as Array<
    [string, string]
  >;

  const clearHref = (() => {
    const qs = new URLSearchParams();
    for (const [key, value] of entries) qs.set(key, value);
    const query = qs.toString();
    return query ? `${action}?${query}` : action;
  })();

  return (
    <form action={action} method="get" className={`flex w-full gap-2 sm:w-auto ${className}`} role="search">
      {entries.map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}

      <div className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          name="q"
          defaultValue={defaultValue ?? ''}
          placeholder={placeholder}
          aria-label={placeholder}
          className="input pl-9 pr-9"
        />
        {defaultValue && (
          <Link
            href={clearHref}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <IconClose className="h-4 w-4" />
          </Link>
        )}
      </div>

      <button type="submit" className="btn-ghost shrink-0">
        Search
      </button>
    </form>
  );
}
