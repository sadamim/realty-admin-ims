'use client';

// Enquiries are read-only apart from one additive flag: `handled`. Nothing
// about the imported lead documents is rewritten.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { IconCheck, IconMail, IconPhone } from '@/components/icons';
import type { LeadRecord } from '@/lib/leads';

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export default function EnquiryList({
  leads,
  canWrite,
}: {
  leads: LeadRecord[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState<LeadRecord | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleHandled(lead: LeadRecord) {
    setBusyId(lead._id);
    try {
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handled: !lead.handled }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ kind: 'error', title: 'Update failed', description: data.error });
        return;
      }
      toast({
        kind: 'success',
        title: lead.handled ? 'Marked as new' : 'Marked as handled',
        description: lead.name,
      });
      setOpen(null);
      router.refresh();
    } catch {
      toast({ kind: 'error', title: 'Could not reach the server' });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="table-wrap hidden md:block">
        <div className="table-scroll">
          <table className="w-full min-w-[880px] border-collapse">
            <thead>
              <tr>
                <th className="th">From</th>
                <th className="th">Contact</th>
                <th className="th">Enquiry</th>
                <th className="th">Received</th>
                <th className="th">Status</th>
                <th className="th w-px" />
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead._id} className="row cursor-pointer" onClick={() => setOpen(lead)}>
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-50 text-[11px] font-bold uppercase text-navy-400">
                        {lead.name.slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{lead.name}</p>
                        {lead.project && (
                          <p className="truncate text-xs text-slate-400">{lead.project}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <div className="space-y-0.5 text-[13px]">
                      {lead.email && <p className="truncate text-slate-600">{lead.email}</p>}
                      {lead.phone && <p className="text-slate-500">{lead.phone}</p>}
                      {!lead.email && !lead.phone && <span className="text-slate-300">—</span>}
                    </div>
                  </td>
                  <td className="td max-w-[300px]">
                    <p className="truncate text-slate-600">
                      {lead.message || <span className="text-slate-300">No message</span>}
                    </p>
                  </td>
                  <td className="td whitespace-nowrap text-slate-500">{formatDate(lead.createdAt)}</td>
                  <td className="td">
                    {lead.handled ? (
                      <span className="badge-success">Handled</span>
                    ) : (
                      <span className="badge-info">New</span>
                    )}
                  </td>
                  <td className="td text-right">
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpen(lead);
                      }}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="space-y-3 md:hidden">
        {leads.map((lead) => (
          <li key={lead._id}>
            <button
              type="button"
              onClick={() => setOpen(lead)}
              className="card-interactive w-full p-4 text-left"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-50 text-[11px] font-bold uppercase text-navy-400">
                  {lead.name.slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{lead.name}</p>
                  <p className="truncate text-xs text-slate-500">{lead.email || lead.phone || '—'}</p>
                  {lead.message && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{lead.message}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {lead.handled ? (
                      <span className="badge-success">Handled</span>
                    ) : (
                      <span className="badge-info">New</span>
                    )}
                    <span className="text-[11px] text-slate-400">{formatDate(lead.createdAt)}</span>
                  </div>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <Modal
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open?.name ?? 'Enquiry'}
        description={open ? formatDate(open.createdAt) : undefined}
        footer={
          open && (
            <>
              <button type="button" className="btn-ghost" onClick={() => setOpen(null)}>
                Close
              </button>
              {canWrite && (
                <button
                  type="button"
                  className={open.handled ? 'btn-ghost' : 'btn-primary'}
                  disabled={busyId === open._id}
                  onClick={() => toggleHandled(open)}
                >
                  {busyId === open._id ? <Spinner className="h-4 w-4" /> : <IconCheck className="h-4 w-4" />}
                  {open.handled ? 'Mark as new' : 'Mark as handled'}
                </button>
              )}
            </>
          )
        }
      >
        {open && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {open.handled ? (
                <span className="badge-success">Handled{open.handledBy ? ` by ${open.handledBy}` : ''}</span>
              ) : (
                <span className="badge-info">New</span>
              )}
              {open.source && <span className="badge-neutral">{open.source}</span>}
              {open.project && <span className="badge-neutral">{open.project}</span>}
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              {open.email && (
                <div>
                  <dt className="label mb-0.5">Email</dt>
                  <dd>
                    <a
                      href={`mailto:${open.email}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline"
                    >
                      <IconMail className="h-4 w-4" />
                      {open.email}
                    </a>
                  </dd>
                </div>
              )}
              {open.phone && (
                <div>
                  <dt className="label mb-0.5">Phone</dt>
                  <dd>
                    <a
                      href={`tel:${open.phone}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline"
                    >
                      <IconPhone className="h-4 w-4" />
                      {open.phone}
                    </a>
                  </dd>
                </div>
              )}
            </dl>

            <div>
              <p className="label mb-1">Message</p>
              <p className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-700">
                {open.message || 'No message was submitted with this enquiry.'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
