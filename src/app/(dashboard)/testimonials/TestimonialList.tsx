'use client';

// The list doubles as the ordering and visibility control: show/hide and
// up/down are PATCHes that touch nothing else on the document, so they are safe
// to fire straight from here. Everything else opens the editor.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { IconChevronDown, IconChevronUp, IconEdit, IconEye, IconEyeOff, IconQuote, IconStar } from '@/components/icons';
import type { TestimonialRecord } from '@/lib/testimonials';

export default function TestimonialList({
  testimonials,
  canWrite,
}: {
  testimonials: TestimonialRecord[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function patch(id: string, body: Record<string, unknown>, failure: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/testimonials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({ kind: 'error', title: failure, description: data.error });
        return;
      }
      router.refresh();
    } catch {
      toast({ kind: 'error', title: 'Could not reach the server' });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ul className="space-y-3">
      {testimonials.map((item, index) => (
        <li
          key={item._id}
          className={`card flex flex-col gap-4 p-4 sm:flex-row sm:items-start ${
            item.active ? '' : 'opacity-70'
          }`}
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
            {item.imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <span className="text-sm font-semibold text-slate-400">
                {item.name.slice(0, 1).toUpperCase() || '?'}
              </span>
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-900">{item.name || 'Unnamed'}</p>
              {item.role && <span className="text-sm text-slate-500">· {item.role}</span>}
              {!item.active && <span className="badge-neutral">Hidden</span>}
            </div>

            <p className="mt-1 flex items-center gap-0.5" aria-label={`${item.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, star) => (
                <IconStar
                  key={star}
                  className={`h-3.5 w-3.5 ${star < item.rating ? 'text-amber-400' : 'text-slate-200'}`}
                />
              ))}
            </p>

            <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.quote}</p>

            {(item.project || item.location) && (
              <p className="mt-1.5 text-xs text-slate-400">
                {[item.project, item.location].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          {canWrite && (
            <div className="flex shrink-0 items-center gap-1 self-start">
              <button
                type="button"
                className="btn-quiet btn-sm"
                disabled={busyId === item._id || index === 0}
                onClick={() => patch(item._id, { action: 'move', direction: 'up' }, 'Could not reorder')}
                aria-label="Move up"
              >
                <IconChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="btn-quiet btn-sm"
                disabled={busyId === item._id || index === testimonials.length - 1}
                onClick={() => patch(item._id, { action: 'move', direction: 'down' }, 'Could not reorder')}
                aria-label="Move down"
              >
                <IconChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="btn-quiet btn-sm"
                disabled={busyId === item._id}
                onClick={() => patch(item._id, { active: !item.active }, 'Could not change visibility')}
                aria-label={item.active ? 'Hide from the website' : 'Show on the website'}
              >
                {item.active ? <IconEye className="h-4 w-4" /> : <IconEyeOff className="h-4 w-4" />}
              </button>
              <Link href={`/testimonials/${item._id}`} className="btn-ghost btn-sm">
                <IconEdit className="h-3.5 w-3.5" />
                Edit
              </Link>
            </div>
          )}

          {!canWrite && <IconQuote className="h-5 w-5 shrink-0 text-slate-300" />}
        </li>
      ))}
    </ul>
  );
}
