import Link from 'next/link';
import { listLeads } from '@/lib/leads';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import SearchBox from '@/components/SearchBox';
import EmptyState from '@/components/ui/EmptyState';
import EnquiryList from './EnquiryList';
import { IconInbox } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Enquiries — Realty Focus Admin' };

const FILTERS: Array<{ label: string; value: string | undefined }> = [
  { label: 'All', value: undefined },
  { label: 'New', value: 'new' },
  { label: 'Handled', value: 'handled' },
];

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const { page: pageParam, q, status } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);

  const [{ items, total, totalPages }, user] = await Promise.all([
    listLeads({ page, limit: 20, search: q, status }),
    getSessionUser(),
  ]);

  const isFiltered = Boolean(q || status);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Engagement"
        title="Enquiries"
        description="Leads submitted through the website's contact and project forms."
        actions={
          <SearchBox
            action="/enquiries"
            defaultValue={q}
            keep={{ status }}
            placeholder="Name, email, phone or message…"
          />
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => {
          const active = (status ?? undefined) === filter.value;
          const qs = new URLSearchParams();
          if (q) qs.set('q', q);
          if (filter.value) qs.set('status', filter.value);
          return (
            <Link
              key={filter.label}
              href={`/enquiries${qs.toString() ? `?${qs}` : ''}`}
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
            icon={IconInbox}
            title={isFiltered ? 'No enquiries match those filters' : 'No enquiries yet'}
            description={
              isFiltered
                ? 'Try a different search term, or clear the filters to see everything.'
                : 'Submissions from the website land here as soon as the contact form saves them.'
            }
            actionLabel={isFiltered ? 'Clear filters' : undefined}
            actionHref={isFiltered ? '/enquiries' : undefined}
          />
        </div>
      ) : (
        <>
          <EnquiryList leads={items} canWrite={can(user?.role, 'leads.write')} />
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            basePath="/enquiries"
            params={{ q, status }}
          />
        </>
      )}
    </div>
  );
}
