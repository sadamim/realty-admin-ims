import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlog, listBlogCategories } from '@/lib/blogs';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import BlogEditor from '../BlogEditor';
import { IconArrowLeft } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [blog, categories, user] = await Promise.all([
    getBlog(id),
    listBlogCategories(),
    getSessionUser(),
  ]);
  if (!blog) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/blogs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to blogs
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-[26px] font-bold leading-tight tracking-[-0.01em] text-slate-900">
            {blog.title}
          </h1>
          {blog.status === 'published' ? (
            <span className="badge-success">Published</span>
          ) : (
            <span className="badge-warning">Draft</span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          <code className="code-chip">/blogs/{blog.slug}</code> · {blog.readTime}
        </p>
      </div>

      <BlogEditor
        blog={blog}
        categories={categories}
        canWrite={can(user?.role, 'content.write')}
      />
    </div>
  );
}
