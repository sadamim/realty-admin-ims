'use client';

// Ordering, visibility and deletion happen inline; editing opens the full form.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Spinner from '@/components/ui/Spinner';
import {
  IconChevronDown,
  IconChevronUp,
  IconEdit,
  IconEye,
  IconEyeOff,
  IconTrash,
} from '@/components/icons';
import type { BannerRecord } from '@/lib/banners';

export default function BannerList({
  banners,
  canWrite,
}: {
  banners: BannerRecord[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<BannerRecord | null>(null);

  async function patch(banner: BannerRecord, body: Record<string, unknown>, successTitle: string) {
    setPendingId(banner._id);
    try {
      const res = await fetch(`/api/banners/${banner._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ kind: 'error', title: 'Update failed', description: data.error });
        return;
      }
      toast({ kind: 'success', title: successTitle });
      router.refresh();
    } catch {
      toast({ kind: 'error', title: 'Could not reach the server' });
    } finally {
      setPendingId(null);
    }
  }

  async function remove(banner: BannerRecord) {
    setPendingId(banner._id);
    try {
      const res = await fetch(`/api/banners/${banner._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast({ kind: 'error', title: 'Delete failed', description: data.error });
        return;
      }
      toast({ kind: 'success', title: 'Banner deleted' });
      router.refresh();
    } catch {
      toast({ kind: 'error', title: 'Could not reach the server' });
    } finally {
      setPendingId(null);
      setConfirm(null);
    }
  }

  return (
    <>
      <ul className="space-y-4">
        {banners.map((banner, index) => {
          const busy = pendingId === banner._id;
          return (
            <li
              key={banner._id}
              className={`card animate-fade-up overflow-hidden ${banner.active ? '' : 'opacity-70'}`}
              style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
            >
              <div className="flex flex-col sm:flex-row">
                <div className="relative aspect-[21/9] w-full shrink-0 bg-slate-100 sm:aspect-auto sm:h-[150px] sm:w-[266px]">
                  {banner.imageSrc && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={banner.imageSrc} alt="" className="h-full w-full object-cover" />
                  )}
                  <span className="absolute left-2 top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-ink/70 px-1.5 text-[11px] font-bold text-white backdrop-blur">
                    {index + 1}
                  </span>
                  {busy && (
                    <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                      <Spinner className="h-5 w-5 text-navy" />
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-slate-900">
                        {banner.title || <span className="text-slate-400">Image only — no headline</span>}
                      </h3>
                      {banner.active ? (
                        <span className="badge-success">Live</span>
                      ) : (
                        <span className="badge-neutral">Hidden</span>
                      )}
                    </div>
                    {banner.subtitle && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{banner.subtitle}</p>
                    )}
                    {banner.ctaLabel && (
                      <p className="mt-1.5 text-xs text-slate-400">
                        Button: <span className="font-medium text-slate-600">{banner.ctaLabel}</span>
                        {banner.ctaHref && ` → ${banner.ctaHref}`}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link href={`/banners/${banner._id}`} className="btn-ghost btn-sm">
                      <IconEdit className="h-3.5 w-3.5" />
                      {canWrite ? 'Edit' : 'View'}
                    </Link>

                    {canWrite && (
                      <>
                        <button
                          type="button"
                          className="btn-ghost btn-sm"
                          disabled={busy}
                          onClick={() =>
                            patch(
                              banner,
                              { active: !banner.active },
                              banner.active ? 'Banner hidden' : 'Banner is live',
                            )
                          }
                        >
                          {banner.active ? (
                            <IconEyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <IconEye className="h-3.5 w-3.5" />
                          )}
                          {banner.active ? 'Hide' : 'Show'}
                        </button>

                        <span className="ml-auto flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="Move up"
                            className="btn-quiet btn-icon"
                            disabled={busy || index === 0}
                            onClick={() => patch(banner, { action: 'move', direction: 'up' }, 'Order updated')}
                          >
                            <IconChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Move down"
                            className="btn-quiet btn-icon"
                            disabled={busy || index === banners.length - 1}
                            onClick={() => patch(banner, { action: 'move', direction: 'down' }, 'Order updated')}
                          >
                            <IconChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${banner.title || 'banner'}`}
                            className="btn-quiet btn-icon text-slate-400 hover:bg-brand-50 hover:text-brand"
                            disabled={busy}
                            onClick={() => setConfirm(banner)}
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={Boolean(confirm)}
        busy={pendingId === confirm?._id}
        title="Delete this banner?"
        description={
          confirm
            ? `“${confirm.title || 'Untitled slide'}” is removed from the database and disappears from the homepage hero.`
            : ''
        }
        confirmLabel="Delete banner"
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && remove(confirm)}
      />
    </>
  );
}
