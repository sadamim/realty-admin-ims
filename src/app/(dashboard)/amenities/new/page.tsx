import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import AmenityEditor from '../AmenityEditor';
import { IconArrowLeft } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New amenity — Realty Focus Admin' };

export default async function NewAmenityPage() {
  const user = await getSessionUser();
  if (!can(user?.role, 'content.write')) redirect('/amenities');

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
          New amenity
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          It takes the next id in the existing sequence and becomes selectable on every project.
        </p>
      </div>

      <AmenityEditor amenity={null} canWrite />
    </div>
  );
}
