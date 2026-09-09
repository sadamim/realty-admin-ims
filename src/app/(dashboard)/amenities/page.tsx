import Link from 'next/link';
import { listAmenities } from '@/lib/amenities';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import PageHeader from '@/components/PageHeader';
import AmenityGrid from './AmenityGrid';
import { IconPlus } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Amenities — Realty Focus Admin' };

export default async function AmenitiesPage() {
  const [amenities, user] = await Promise.all([listAmenities(), getSessionUser()]);
  const canWrite = can(user?.role, 'content.write');

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Library"
        title="Amenities"
        description={
          <>
            Shared across every project through the comma-separated{' '}
            <code className="code-chip">microsite_detail.am_id</code> list.
          </>
        }
        actions={
          canWrite && (
            <Link href="/amenities/new" className="btn-primary">
              <IconPlus className="h-4 w-4" />
              New amenity
            </Link>
          )
        }
      />
      <AmenityGrid amenities={amenities} canWrite={canWrite} />
    </div>
  );
}
