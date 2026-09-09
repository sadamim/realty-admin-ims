import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import BuilderEditor from '../BuilderEditor';
import { IconArrowLeft } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New builder — Realty Focus Admin' };

export default async function NewBuilderPage() {
  const user = await getSessionUser();
  if (!can(user?.role, 'content.write')) redirect('/builders');

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/builders"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to builders
        </Link>
        <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em] text-slate-900">
          New builder
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          The builder is given the next id in the existing sequence, so projects can link to it the
          same way they link to an imported one.
        </p>
      </div>

      <BuilderEditor builder={null} canWrite />
    </div>
  );
}
