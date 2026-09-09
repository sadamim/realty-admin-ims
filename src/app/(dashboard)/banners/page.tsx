import Link from 'next/link';
import { listBanners } from '@/lib/banners';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import BannerList from './BannerList';
import { IconImage, IconInfo, IconPlus } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Banners — Realty Focus Admin' };

export default async function BannersPage() {
  const [banners, user] = await Promise.all([listBanners(), getSessionUser()]);
  const canWrite = can(user?.role, 'content.write');
  const liveCount = banners.filter((banner) => banner.active).length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Content"
        title="Banners"
        description="Slides for the homepage hero, shown in the order below."
        actions={
          canWrite && (
            <Link href="/banners/new" className="btn-primary">
              <IconPlus className="h-4 w-4" />
              New banner
            </Link>
          )
        }
      />

      {banners.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={IconImage}
            title="No banners yet"
            description="Until you add one, the website keeps using its built-in hero image. Add a banner to take control of it."
            actionLabel={canWrite ? 'Add the first banner' : undefined}
            actionHref={canWrite ? '/banners/new' : undefined}
          />
        </div>
      ) : (
        <>
          <div className="card flex flex-col gap-1 border-navy-200 bg-navy-50/60 p-4 sm:flex-row sm:items-center sm:gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-navy-800">
              <IconInfo className="h-4 w-4" />
              {liveCount === 0
                ? 'No banner is live'
                : `${liveCount} banner${liveCount === 1 ? '' : 's'} live on the homepage`}
            </p>
            <p className="text-sm text-navy-600">
              {liveCount === 0
                ? 'The website falls back to its built-in hero image while every slide is hidden.'
                : 'The first live slide loads immediately; the rest cross-fade behind it.'}
            </p>
          </div>

          <BannerList banners={banners} canWrite={canWrite} />
        </>
      )}
    </div>
  );
}
