import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBanner } from '@/lib/banners';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import BannerEditor from '../BannerEditor';
import { IconArrowLeft } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [banner, user] = await Promise.all([getBanner(id), getSessionUser()]);
  if (!banner) notFound();

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

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-[26px] font-bold leading-tight tracking-[-0.01em] text-slate-900">
            {banner.title || 'Untitled banner'}
          </h1>
          {banner.active ? (
            <span className="badge-success">Live</span>
          ) : (
            <span className="badge-neutral">Hidden</span>
          )}
        </div>
      </div>

      <BannerEditor banner={banner} canWrite={can(user?.role, 'content.write')} />
    </div>
  );
}
