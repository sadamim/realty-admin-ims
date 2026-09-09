'use client';

// Same list-as-control pattern as testimonials: reorder and show/hide are
// PATCHes that touch nothing else on the document.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { IconChevronDown, IconChevronUp, IconEdit, IconEye, IconEyeOff, IconMail, IconPhone } from '@/components/icons';
import type { TeamRecord } from '@/lib/team';

export default function TeamList({
  members,
  canWrite,
}: {
  members: TeamRecord[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function patch(id: string, body: Record<string, unknown>, failure: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/team/${id}`, {
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
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {members.map((member, index) => (
        <li
          key={member._id}
          className={`card flex flex-col p-4 ${member.active ? '' : 'opacity-70'}`}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
              {member.imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.imageSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <span className="text-sm font-semibold text-slate-400">
                  {member.name.slice(0, 1).toUpperCase() || '?'}
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">{member.name || 'Unnamed'}</p>
              <p className="truncate text-sm text-slate-500">{member.title || '—'}</p>
              {!member.active && <span className="badge-neutral mt-1.5 inline-flex">Hidden</span>}
            </div>
          </div>

          {member.bio && <p className="mt-3 line-clamp-3 text-sm text-slate-600">{member.bio}</p>}

          {(member.email || member.phone) && (
            <div className="mt-3 space-y-1 text-xs text-slate-500">
              {member.email && (
                <p className="flex items-center gap-1.5 truncate">
                  <IconMail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {member.email}
                </p>
              )}
              {member.phone && (
                <p className="flex items-center gap-1.5 truncate">
                  <IconPhone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {member.phone}
                </p>
              )}
            </div>
          )}

          {canWrite && (
            <div className="mt-4 flex items-center gap-1 border-t border-slate-100 pt-3">
              <button
                type="button"
                className="btn-quiet btn-sm"
                disabled={busyId === member._id || index === 0}
                onClick={() => patch(member._id, { action: 'move', direction: 'up' }, 'Could not reorder')}
                aria-label="Move up"
              >
                <IconChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="btn-quiet btn-sm"
                disabled={busyId === member._id || index === members.length - 1}
                onClick={() => patch(member._id, { action: 'move', direction: 'down' }, 'Could not reorder')}
                aria-label="Move down"
              >
                <IconChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="btn-quiet btn-sm"
                disabled={busyId === member._id}
                onClick={() => patch(member._id, { active: !member.active }, 'Could not change visibility')}
                aria-label={member.active ? 'Hide from the website' : 'Show on the website'}
              >
                {member.active ? <IconEye className="h-4 w-4" /> : <IconEyeOff className="h-4 w-4" />}
              </button>
              <Link href={`/team/${member._id}`} className="btn-ghost btn-sm ml-auto">
                <IconEdit className="h-3.5 w-3.5" />
                Edit
              </Link>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
