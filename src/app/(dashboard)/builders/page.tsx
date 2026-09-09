import Link from 'next/link';
import { listBuilders } from '@/lib/builders';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import Pagination from '@/components/Pagination';
import SearchBox from '@/components/SearchBox';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { IconEdit, IconHardHat, IconPlus } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Builders — Realty Focus Admin' };

export default async function BuildersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);

  const [{ items, total, totalPages }, user] = await Promise.all([
    listBuilders({ page, limit: 20, search: q }),
    getSessionUser(),
  ]);
  const canWrite = can(user?.role, 'content.write');

  // Scales the inline bar against the busiest builder on this page only.
  const peak = items.reduce((max, b) => Math.max(max, b.projectCount ?? 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Catalogue"
        title="Builders"
        description="Developers shown on the website, and the projects linked to each."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SearchBox action="/builders" defaultValue={q} placeholder="Builder name…" />
            {canWrite && (
              <Link href="/builders/new" className="btn-primary shrink-0">
                <IconPlus className="h-4 w-4" />
                New builder
              </Link>
            )}
          </div>
        }
      />

      {items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={IconHardHat}
            title={q ? 'No builders match that search' : 'No builders yet'}
            description={
              q
                ? 'Check the spelling, or clear the search to list every builder.'
                : 'Add a builder and projects will be able to link to it.'
            }
            actionLabel={q ? 'Clear search' : canWrite ? 'Add the first builder' : undefined}
            actionHref={q ? '/builders' : canWrite ? '/builders/new' : undefined}
          />
        </div>
      ) : (
        <>
          <div className="table-wrap hidden md:block">
            <div className="table-scroll">
              <table className="w-full min-w-[820px] border-collapse">
                <thead>
                  <tr>
                    <th className="th">Builder</th>
                    <th className="th">Established</th>
                    <th className="th">Cities</th>
                    <th className="th">Projects</th>
                    <th className="th">Status</th>
                    <th className="th w-px" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((builder) => (
                    <tr key={builder._id} className="row">
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                            {builder.logoSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={builder.logoSrc}
                                alt=""
                                className="h-full w-full object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <IconHardHat className="h-4 w-4 text-slate-300" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold capitalize text-slate-900">
                              {builder.name}
                            </p>
                            <p className="text-xs text-slate-400">#{builder.builder_id || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="td">
                        {builder.established || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="td">
                        {builder.locations.length ? (
                          <span className="truncate">{builder.locations.slice(0, 3).join(', ')}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="td">
                        <div className="flex items-center gap-2">
                          <span className="w-8 tabular-nums text-slate-700">
                            {builder.projectCount}
                          </span>
                          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                            <span
                              className="block h-full rounded-full bg-navy/70"
                              style={{
                                width: peak ? `${Math.round((builder.projectCount / peak) * 100)}%` : '0%',
                              }}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="td">
                        {builder.active ? (
                          <span className="badge-success">Live</span>
                        ) : (
                          <span className="badge-neutral">Hidden</span>
                        )}
                      </td>
                      <td className="td text-right">
                        <Link
                          href={`/builders/${builder._id}`}
                          className="btn-ghost btn-sm"
                          aria-label={`Edit ${builder.name}`}
                        >
                          <IconEdit className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="space-y-3 md:hidden">
            {items.map((builder) => (
              <li key={builder._id}>
                <Link href={`/builders/${builder._id}`} className="card-interactive flex items-start gap-3 p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                    {builder.logoSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={builder.logoSrc} alt="" className="h-full w-full object-contain" loading="lazy" />
                    ) : (
                      <IconHardHat className="h-4 w-4 text-slate-300" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold capitalize text-slate-900">
                      {builder.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {builder.locations.slice(0, 3).join(', ') || 'No cities listed'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="badge-neutral">{builder.projectCount} projects</span>
                      {!builder.active && <span className="badge-neutral">Hidden</span>}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            basePath="/builders"
            params={{ q }}
          />
        </>
      )}
    </div>
  );
}
