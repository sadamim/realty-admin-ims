import Link from 'next/link';
import { redirect } from 'next/navigation';
import { listBlogCategories } from '@/lib/blogs';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import BlogEditor from '../BlogEditor';
import { IconArrowLeft } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New post — Realty Focus Admin' };

export default async function NewBlogPage() {
  const user = await getSessionUser();
  if (!can(user?.role, 'content.write')) redirect('/blogs');

  const categories = await listBlogCategories();

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
        <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em] text-slate-900">
          New post
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Save as a draft first if you are not ready to publish.
        </p>
      </div>

      <BlogEditor blog={null} categories={categories} canWrite />
    </div>
  );
}
