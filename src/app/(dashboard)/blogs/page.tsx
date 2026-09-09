import Link from 'next/link';
import { listBlogCategories, listBlogs } from '@/lib/blogs';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import SearchBox from '@/components/SearchBox';
import EmptyState from '@/components/ui/EmptyState';
import ProjectThumb from '@/components/ProjectThumb';
import { IconCalendar, IconEdit, IconNews, IconPlus } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Blogs — Realty Focus Admin' };

const STATUS_FILTERS: Array<{ label: string; value: string | undefined }> = [
  { label: 'All', value: undefined },
  { label: 'Published', value: 'published' },
  { label: 'Drafts', value: 'draft' },
];

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string; category?: string }>;
}) {
  const { page: pageParam, q, status, category } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);

  const [{ items, total, totalPages }, categories, user] = await Promise.all([
    listBlogs({ page, limit: 20, search: q, status, category }),
    listBlogCategories(),
    getSessionUser(),
  ]);

  const canWrite = can(user?.role, 'content.write');
  const isFiltered = Boolean(q || status || category);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Content"
        title="Blogs"
        description="Articles published on the public website."
        actions={
          <>
            <SearchBox
              action="/blogs"
              defaultValue={q}
              keep={{ status, category }}
              placeholder="Title, category or author…"
            />
            {canWrite && (
              <Link href="/blogs/new" className="btn-primary">
                <IconPlus className="h-4 w-4" />
                New post
              </Link>
            )}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((filter) => {
          const active = (status ?? undefined) === filter.value;
          const qs = new URLSearchParams();
          if (q) qs.set('q', q);
          if (category) qs.set('category', category);
          if (filter.value) qs.set('status', filter.value);
          return (
            <Link
              key={filter.label}
              href={`/blogs${qs.toString() ? `?${qs}` : ''}`}
              className={active ? 'chip-active' : 'chip'}
            >
              {filter.label}
            </Link>
          );
        })}

        {categories.length > 0 && (
          <>
            <span aria-hidden="true" className="mx-1 h-5 w-px bg-slate-200" />
            {categories.slice(0, 6).map((name) => {
              const active = category === name;
              const qs = new URLSearchParams();
              if (q) qs.set('q', q);
              if (status) qs.set('status', status);
              if (!active) qs.set('category', name);
              return (
                <Link
                  key={name}
                  href={`/blogs${qs.toString() ? `?${qs}` : ''}`}
                  className={active ? 'chip-active' : 'chip'}
                >
                  {name}
                </Link>
              );
            })}
          </>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={IconNews}
            title={isFiltered ? 'No posts match those filters' : 'No blog posts yet'}
            description={
              isFiltered
                ? 'Try a different search term, or clear the filters to see everything.'
                : 'Write your first post and it appears on the website straight away.'
            }
            actionLabel={isFiltered ? 'Clear filters' : canWrite ? 'Write the first post' : undefined}
            actionHref={isFiltered ? '/blogs' : canWrite ? '/blogs/new' : undefined}
          />
        </div>
      ) : (
        <>
          <div className="table-wrap hidden md:block">
            <div className="table-scroll">
              <table className="w-full min-w-[860px] border-collapse">
                <thead>
                  <tr>
                    <th className="th">Post</th>
                    <th className="th">Category</th>
                    <th className="th">Author</th>
                    <th className="th">Status</th>
                    <th className="th">Published</th>
                    <th className="th w-px" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((post) => (
                    <tr key={post._id} className="row">
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <ProjectThumb name={post.title} image={post.imageSrc} />
                          <div className="min-w-0 max-w-[340px]">
                            <p className="truncate font-semibold text-slate-900">{post.title}</p>
                            <p className="truncate text-xs text-slate-400">/blogs/{post.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="td">
                        <span className="badge-neutral">{post.category}</span>
                      </td>
                      <td className="td text-slate-600">{post.author}</td>
                      <td className="td">
                        {post.status === 'published' ? (
                          <span className="badge-success">Published</span>
                        ) : (
                          <span className="badge-warning">Draft</span>
                        )}
                      </td>
                      <td className="td whitespace-nowrap text-slate-500">
                        {formatDate(post.publishedAt)}
                      </td>
                      <td className="td text-right">
                        <Link href={`/blogs/${post._id}`} className="btn-ghost btn-sm">
                          <IconEdit className="h-3.5 w-3.5" />
                          {canWrite ? 'Edit' : 'View'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="space-y-3 md:hidden">
            {items.map((post) => (
              <li key={post._id}>
                <Link href={`/blogs/${post._id}`} className="card-interactive flex items-start gap-3 p-4">
                  <ProjectThumb name={post.title} image={post.imageSrc} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">{post.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <IconCalendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {formatDate(post.publishedAt)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="badge-neutral">{post.category}</span>
                      {post.status === 'published' ? (
                        <span className="badge-success">Published</span>
                      ) : (
                        <span className="badge-warning">Draft</span>
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
            basePath="/blogs"
            params={{ q, status, category }}
          />
        </>
      )}
    </div>
  );
}
