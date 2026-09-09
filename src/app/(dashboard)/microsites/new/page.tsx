import Link from 'next/link';
import { redirect } from 'next/navigation';
import { micrositeOptions } from '@/lib/admin-data';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import MicrositeCreateForm from '../MicrositeCreateForm';
import { IconArrowLeft } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New project — Realty Focus Admin' };

export default async function NewMicrositePage() {
  const user = await getSessionUser();
  if (!can(user?.role, 'content.write')) redirect('/microsites');

  const options = await micrositeOptions();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/microsites"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>
        <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em] text-slate-900">
          New project
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Enough to get it on the website. Everything else is on the edit screen straight after.
        </p>
      </div>

      <MicrositeCreateForm options={options} />
    </div>
  );
}
