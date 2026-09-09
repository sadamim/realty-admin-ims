import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTestimonial } from '@/lib/testimonials';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import TestimonialEditor from '../TestimonialEditor';
import { IconArrowLeft } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [testimonial, user] = await Promise.all([getTestimonial(id), getSessionUser()]);
  if (!testimonial) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/testimonials"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to testimonials
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-[26px] font-bold leading-tight tracking-[-0.01em] text-slate-900">
            {testimonial.name || 'Untitled'}
          </h1>
          {testimonial.active ? (
            <span className="badge-success">Live</span>
          ) : (
            <span className="badge-neutral">Hidden</span>
          )}
        </div>
      </div>

      <TestimonialEditor testimonial={testimonial} canWrite={can(user?.role, 'content.write')} />
    </div>
  );
}
