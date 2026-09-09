import Link from 'next/link';
import { listTestimonials } from '@/lib/testimonials';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import TestimonialList from './TestimonialList';
import { IconInfo, IconPlus, IconQuote } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Testimonials — Realty Focus Admin' };

export default async function TestimonialsPage() {
  const [testimonials, user] = await Promise.all([listTestimonials(), getSessionUser()]);
  const canWrite = can(user?.role, 'content.write');
  const liveCount = testimonials.filter((item) => item.active).length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Content"
        title="Testimonials"
        description="What clients said, shown on the homepage in the order below."
        actions={
          canWrite && (
            <Link href="/testimonials/new" className="btn-primary">
              <IconPlus className="h-4 w-4" />
              New testimonial
            </Link>
          )
        }
      />

      {testimonials.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={IconQuote}
            title="No testimonials yet"
            description="The website skips the section entirely until there is at least one, so nothing looks broken in the meantime."
            actionLabel={canWrite ? 'Add the first testimonial' : undefined}
            actionHref={canWrite ? '/testimonials/new' : undefined}
          />
        </div>
      ) : (
        <>
          <div className="card flex flex-col gap-1 border-navy-200 bg-navy-50/60 p-4 sm:flex-row sm:items-center sm:gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-navy-800">
              <IconInfo className="h-4 w-4" />
              {liveCount === 0
                ? 'Nothing is live'
                : `${liveCount} testimonial${liveCount === 1 ? '' : 's'} on the homepage`}
            </p>
            <p className="text-sm text-navy-600">
              {liveCount === 0
                ? 'The homepage section is hidden while every testimonial is hidden.'
                : 'They appear in this order, newest changes live within a minute.'}
            </p>
          </div>

          <TestimonialList testimonials={testimonials} canWrite={canWrite} />
        </>
      )}
    </div>
  );
}
