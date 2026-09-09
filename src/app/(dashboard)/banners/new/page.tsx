import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import BannerEditor from '../BannerEditor';
import { IconArrowLeft } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New banner — Realty Focus Admin' };

export default async function NewBannerPage() {
  const user = await getSessionUser();
  if (!can(user?.role, 'content.write')) redirect('/banners');

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/banners"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to banners
        </Link>
        <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em] text-slate-900">
          New banner
        </h1>
        <p className="mt-1 text-sm text-slate-500">New slides are added to the end of the order.</p>
      </div>

      <BannerEditor banner={null} canWrite />
    </div>
  );
}
