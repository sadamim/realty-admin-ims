import { listBuilders } from '@/lib/admin-data';
import Pagination from '@/components/Pagination';
import SearchBox from '@/components/SearchBox';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { IconHardHat } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Builders — Realty Focus Admin' };

export default async function BuildersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);

  const { items, total, totalPages } = await listBuilders({ page, limit: 20, search: q });

  // Scales the inline bar against the busiest builder on this page only.
  const peak = items.reduce((max, b) => Math.max(max, b.projectCount ?? 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Catalogue"
        title="Builders"
        description={
          <>
            Project counts come from <code className="code-chip">microsite_detail.builder_id</code>.
          </>
        }
        actions={<SearchBox action="/builders" defaultValue={q} placeholder="Builder name…" />}
      />

      {items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={IconHardHat}
            title={q ? 'No builders match that search' : 'No builders yet'}
            description={
              q
                ? 'Check the spelling, or clear the search to list every builder.'
                : 'Builders imported into the builder collection will appear here.'
            }
            actionLabel={q ? 'Clear search' : undefined}
            actionHref={q ? '/builders' : undefined}
          />
        </div>
      ) : (
        <>
          <div className="table-wrap hidden md:block">
            <div className="table-scroll">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr>
                    <th className="th">Builder</th>
                    <th className="th">Legacy id</th>
                    <th className="th">Address</th>
                    <th className="th w-[220px] text-right">Projects</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((b) => (
                    <tr key={b._id} className="row">
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-xs font-bold uppercase text-navy-400">
                            {(b.name || '?').trim().charAt(0)}
                          </span>
                          <span className="font-semibold capitalize text-slate-900">{b.name}</span>
                        </div>
                      </td>
                      <td className="td">
                        <code className="code-chip">#{b.builder_id}</code>
                      </td>
                      <td className="td max-w-[320px] truncate text-slate-600">
                        {b.address || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="td">
                        <div className="flex items-center justify-end gap-3">
                          <span
                            aria-hidden="true"
                            className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 lg:block"
                          >
                            <span
                              className="block h-full rounded-full bg-navy-400"
                              style={{
                                width: `${peak > 0 ? Math.max(4, ((b.projectCount ?? 0) / peak) * 100) : 0}%`,
                              }}
                            />
                          </span>
                          <span className="w-10 text-right font-semibold tabular-nums text-slate-900">
                            {b.projectCount}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="space-y-3 md:hidden">
            {items.map((b) => (
              <li key={b._id} className="card p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-xs font-bold uppercase text-navy-400">
                    {(b.name || '?').trim().charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold capitalize text-slate-900">{b.name}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{b.address || 'No address'}</p>
                  </div>
                  <span className="badge-neutral shrink-0 tabular-nums">{b.projectCount} projects</span>
                </div>
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
