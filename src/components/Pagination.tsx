import Link from 'next/link';
import { IconChevronLeft, IconChevronRight } from '@/components/icons';

interface Props {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  /** Extra query params to preserve across page links (e.g. the search term). */
  params?: Record<string, string | undefined>;
}

const GROUP = 10;

export default function Pagination({ page, totalPages, total, basePath, params = {} }: Props) {
  if (totalPages <= 1) {
    return (
      <p className="mt-4 text-sm text-slate-500">
        <span className="font-medium text-slate-700 tabular-nums">{total.toLocaleString()}</span>{' '}
        {total === 1 ? 'record' : 'records'}
      </p>
    );
  }

  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
    qs.set('page', String(p));
    return `${basePath}?${qs.toString()}`;
  };

  const group = Math.floor((page - 1) / GROUP);
  const start = group * GROUP + 1;
  const end = Math.min(start + GROUP - 1, totalPages);
  const nums = [];
  for (let i = start; i <= end; i++) nums.push(i);

  const atStart = page === 1;
  const atEnd = page === totalPages;

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-slate-200/80 bg-white px-4 py-3 shadow-card"
    >
      <p className="text-sm text-slate-500">
        <span className="font-medium text-slate-700 tabular-nums">{total.toLocaleString()}</span>{' '}
        records · page <span className="tabular-nums">{page}</span> of{' '}
        <span className="tabular-nums">{totalPages}</span>
      </p>

      <div className="flex max-w-full flex-wrap items-center gap-1.5">
        <Link
          href={href(Math.max(1, page - 1))}
          aria-label="Previous page"
          aria-disabled={atStart}
          tabIndex={atStart ? -1 : undefined}
          className={`btn-ghost btn-sm gap-1 ${atStart ? 'pointer-events-none opacity-40' : ''}`}
        >
          <IconChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          {nums.map((n) => (
            <Link
              key={n}
              href={href(n)}
              aria-current={n === page ? 'page' : undefined}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-[13px]
                font-semibold transition duration-200 ease-smooth ${
                  n === page
                    ? 'border-navy bg-navy text-white shadow-card'
                    : 'border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              {n}
            </Link>
          ))}
        </div>

        <Link
          href={href(Math.min(totalPages, page + 1))}
          aria-label="Next page"
          aria-disabled={atEnd}
          tabIndex={atEnd ? -1 : undefined}
          className={`btn-ghost btn-sm gap-1 ${atEnd ? 'pointer-events-none opacity-40' : ''}`}
        >
          <span className="hidden sm:inline">Next</span>
          <IconChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </nav>
  );
}
