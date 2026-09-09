import Link from 'next/link';
import { listMicrosites } from '@/lib/admin-data';
import Pagination from '@/components/Pagination';
import SearchBox from '@/components/SearchBox';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import ProjectThumb from '@/components/ProjectThumb';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { IconBuilding, IconEdit, IconFilter, IconMapPin, IconPlus } from '@/components/icons';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Projects — Realty Focus Admin' };

const FILTERS: Array<{ label: string; value: string | undefined }> = [
  { label: 'All', value: undefined },
  { label: 'Featured', value: 'featured' },
  { label: 'Trending', value: 'Trending' },
  { label: 'Untagged', value: 'none' },
];

export default async function MicrositesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; type?: string }>;
}) {
  const { page: pageParam, q, type } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);

  const [{ items, total, totalPages }, user] = await Promise.all([
    listMicrosites({ page, limit: 20, search: q, projectType: type }),
    getSessionUser(),
  ]);

  const canWrite = can(user?.role, 'content.write');
  const isFiltered = Boolean(q || type);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Catalogue"
        title="Projects"
        description="Microsites and their linked detail records."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SearchBox
              action="/microsites"
              defaultValue={q}
              keep={{ type }}
              placeholder="Name, location or city…"
            />
            {canWrite && (
              <Link href="/microsites/new" className="btn-primary shrink-0">
                <IconPlus className="h-4 w-4" />
                New project
              </Link>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <IconFilter className="h-3.5 w-3.5" />
          Tag
        </span>
        {FILTERS.map((filter) => {
          const active = (type ?? undefined) === filter.value;
          const qs = new URLSearchParams();
          if (q) qs.set('q', q);
          if (filter.value) qs.set('type', filter.value);
          return (
            <Link
              key={filter.label}
              href={`/microsites${qs.toString() ? `?${qs}` : ''}`}
              aria-current={active ? 'true' : undefined}
              className={active ? 'chip-active' : 'chip'}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={IconBuilding}
            title={isFiltered ? 'No projects match those filters' : 'No projects yet'}
            description={
              isFiltered
                ? 'Try a different search term, or clear the tag filter to see everything.'
                : 'Add one and it goes live on the website straight away.'
            }
            actionLabel={isFiltered ? 'Clear filters' : canWrite ? 'Add the first project' : undefined}
            actionHref={isFiltered ? '/microsites' : canWrite ? '/microsites/new' : undefined}
          />
        </div>
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="table-wrap hidden md:block">
            <div className="table-scroll">
              <table className="w-full min-w-[920px] border-collapse">
                <thead>
                  <tr>
                    <th className="th">Project</th>
                    <th className="th">Builder</th>
                    <th className="th">Location</th>
                    <th className="th">Type</th>
                    <th className="th">Status</th>
                    <th className="th">Tag</th>
                    <th className="th w-px" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((m) => (
                    <tr key={m._id} className="row">
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <ProjectThumb name={m.name} image={m.featured_image} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{m.name}</p>
                            <p className="text-xs text-slate-400">#{m.micro_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="td capitalize">
                        {m.builder_name ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="td capitalize">
                        {[m.location, m.city].filter(Boolean).join(', ') || (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="td capitalize">{m.type ?? <span className="text-slate-300">—</span>}</td>
                      <td className="td">
                        {m.status ? (
                          <span className="badge-neutral capitalize">{m.status}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="td">
                        {m.project_type && m.project_type !== 'none' ? (
                          <span className="badge-info capitalize">{m.project_type}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="td text-right">
                        <Link
                          href={`/microsites/${m._id}`}
                          className="btn-ghost btn-sm"
                          aria-label={`Edit ${m.name}`}
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

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {items.map((m) => (
              <li key={m._id}>
                <Link href={`/microsites/${m._id}`} className="card-interactive flex items-start gap-3 p-4">
                  <ProjectThumb name={m.name} image={m.featured_image} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{m.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs capitalize text-slate-500">
                      <IconMapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {[m.location, m.city].filter(Boolean).join(', ') || 'No location'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.builder_name && (
                        <span className="badge-neutral capitalize">{m.builder_name}</span>
                      )}
                      {m.project_type && m.project_type !== 'none' && (
                        <span className="badge-info capitalize">{m.project_type}</span>
                      )}
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
            basePath="/microsites"
            params={{ q, type }}
          />
        </>
      )}
    </div>
  );
}
