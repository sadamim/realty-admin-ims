import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAmenity } from '@/lib/amenities';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import AmenityEditor from '../AmenityEditor';
import { IconArrowLeft } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function EditAmenityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [amenity, user] = await Promise.all([getAmenity(id), getSessionUser()]);
  if (!amenity) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/amenities"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to amenities
        </Link>
        <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em] text-slate-900">
          {amenity.name}
        </h1>
      </div>

      <AmenityEditor amenity={amenity} canWrite={can(user?.role, 'content.write')} />
    </div>
  );
}
