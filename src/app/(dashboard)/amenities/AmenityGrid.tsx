'use client';

// Client-side filtering only — the whole amenity library is small and already
// loaded, so there is no extra request and no change to the data layer.
//
// Each tile links to its editor when the signed-in role can write; otherwise it
// stays a plain card, exactly as this screen behaved before.
import { useMemo, useState } from 'react';
import Link from 'next/link';
import EmptyState from '@/components/ui/EmptyState';
import { IconClose, IconSearch, IconSparkles } from '@/components/icons';
import type { AmenityRecord } from '@/lib/amenities';

export default function AmenityGrid({
  amenities,
  canWrite,
}: {
  amenities: AmenityRecord[];
  canWrite: boolean;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return amenities;
    return amenities.filter((a) => a.name.toLowerCase().includes(term));
  }, [amenities, query]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter amenities…"
            aria-label="Filter amenities"
            className="input pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear filter"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <IconClose className="h-4 w-4" />
            </button>
          )}
        </div>

        <p className="text-sm text-slate-500">
          <span className="font-medium tabular-nums text-slate-700">{filtered.length}</span> of{' '}
          <span className="tabular-nums">{amenities.length}</span> amenities
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="card mt-4">
          <EmptyState
            icon={IconSparkles}
            title={
              amenities.length === 0 ? 'No amenities yet' : 'No amenities match that filter'
            }
            description={
              amenities.length === 0
                ? 'Add one and it becomes available to every project.'
                : 'Try a shorter term — the list matches on the amenity name.'
            }
            actionLabel={amenities.length === 0 && canWrite ? 'Add an amenity' : undefined}
            actionHref={amenities.length === 0 && canWrite ? '/amenities/new' : undefined}
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((amenity, index) => {
            const inner = (
              <>
                <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                  {amenity.imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={amenity.imageSrc}
                      alt=""
                      className="h-16 w-16 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <IconSparkles className="h-5 w-5 text-slate-300" />
                  )}
                </span>
                <p className="mt-2.5 text-sm font-medium text-slate-800">{amenity.name}</p>
                <p className="text-[11px] text-slate-400">
                  #{amenity.am_id} · {amenity.projectCount} project
                  {amenity.projectCount === 1 ? '' : 's'}
                </p>
              </>
            );

            const className =
              'card-interactive animate-fade-up flex flex-col items-center p-4 text-center';
            const style = { animationDelay: `${Math.min(index, 18) * 25}ms` };

            return canWrite ? (
              <Link key={amenity._id} href={`/amenities/${amenity._id}`} className={className} style={style}>
                {inner}
              </Link>
            ) : (
              <div key={amenity._id} className={className} style={style}>
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
