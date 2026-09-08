import { listAmenities } from '@/lib/admin-data';
import PageHeader from '@/components/PageHeader';
import AmenityGrid from './AmenityGrid';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Amenities — Realty Focus Admin' };

export default async function AmenitiesPage() {
  const amenities = (await listAmenities()) as any[];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Library"
        title="Amenities"
        description={
          <>
            Projects link to these through the comma-separated{' '}
            <code className="code-chip">microsite_detail.am_id</code> list.
          </>
        }
      />
      <AmenityGrid amenities={amenities} />
    </div>
  );
}
