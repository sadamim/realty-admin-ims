import Link from 'next/link';
import { findUsageForMany, listMedia, MEDIA_FOLDERS, MEDIA_FOLDER_LABELS } from '@/lib/media';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import SearchBox from '@/components/SearchBox';
import EmptyState from '@/components/ui/EmptyState';
import MediaGrid from './MediaGrid';
import { IconGallery } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Media — Realty Focus Admin' };

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; folder?: string }>;
}) {
  const { page: pageParam, q, folder } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);

  const [{ items, total, totalPages }, user] = await Promise.all([
    listMedia({ page, limit: 24, search: q, folder }),
    getSessionUser(),
  ]);
  const usage = await findUsageForMany(items.map((item) => item.url));

  const isFiltered = Boolean(q || folder);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Content"
        title="Media"
        description="Images uploaded from this panel, stored in the database and served to both sites."
        actions={<SearchBox action="/media" defaultValue={q} keep={{ folder }} placeholder="Filename or alt text…" />}
      />

      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: 'All', value: undefined as string | undefined },
          ...MEDIA_FOLDERS.map((f) => ({ label: MEDIA_FOLDER_LABELS[f], value: f as string })),
        ].map(
          (filter) => {
            const active = (folder ?? undefined) === filter.value;
            const qs = new URLSearchParams();
            if (q) qs.set('q', q);
            if (filter.value) qs.set('folder', filter.value);
            return (
              <Link
                key={filter.label}
                href={`/media${qs.toString() ? `?${qs}` : ''}`}
                className={`${active ? 'chip-active' : 'chip'} capitalize`}
              >
                {filter.label}
              </Link>
            );
          },
        )}
      </div>

      {items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={IconGallery}
            title={isFiltered ? 'No images match those filters' : 'No images uploaded yet'}
            description={
              isFiltered
                ? 'Try a different term, or clear the filters to see the whole library.'
                : 'Images you upload while editing a project, blog post, banner, builder, amenity, testimonial or team member appear here automatically.'
            }
            actionLabel={isFiltered ? 'Clear filters' : undefined}
            actionHref={isFiltered ? '/media' : undefined}
          />
        </div>
      ) : (
        <>
          <MediaGrid items={items} usage={usage} canWrite={can(user?.role, 'content.write')} />
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            basePath="/media"
            params={{ q, folder }}
          />
        </>
      )}
    </div>
  );
}
