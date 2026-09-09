'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ImageUploader from '@/components/ImageUploader';
import Modal from '@/components/ui/Modal';
import { IconCopy, IconExternal, IconPlus, IconTrash } from '@/components/icons';
import type { MediaRecord } from '@/lib/media';

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

export default function MediaGrid({
  items,
  usage,
  canWrite,
}: {
  items: MediaRecord[];
  usage: Record<string, string[]>;
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [confirm, setConfirm] = useState<MediaRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  async function copy(record: MediaRecord) {
    try {
      await navigator.clipboard.writeText(record.url);
      toast({ kind: 'success', title: 'Path copied', description: record.url });
    } catch {
      toast({ kind: 'warning', title: 'Could not copy', description: record.url });
    }
  }

  async function remove(record: MediaRecord) {
    setBusy(true);
    try {
      const res = await fetch(`/api/media/${record._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast({ kind: 'error', title: 'Delete failed', description: data.error });
        return;
      }
      toast({ kind: 'success', title: 'Image deleted', description: record.filename });
      router.refresh();
    } catch {
      toast({ kind: 'error', title: 'Could not reach the server' });
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  const usedBy = confirm ? (usage[confirm.url] ?? []) : [];

  return (
    <>
      {canWrite && (
        <button type="button" className="btn-primary" onClick={() => setUploadOpen(true)}>
          <IconPlus className="h-4 w-4" />
          Upload image
        </button>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((record, index) => {
          const used = usage[record.url] ?? [];
          return (
            <div
              key={record._id}
              className="card-interactive animate-fade-up overflow-hidden"
              style={{ animationDelay: `${Math.min(index, 15) * 30}ms` }}
            >
              <div className="relative aspect-[4/3] bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={record.url} alt={record.alt} className="h-full w-full object-cover" loading="lazy" />
                <span className="absolute left-2 top-2 rounded-md bg-ink/65 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                  {record.folder}
                </span>
              </div>

              <div className="p-3">
                <p className="truncate text-[13px] font-semibold text-slate-900" title={record.filename}>
                  {record.filename}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {formatSize(record.size)}
                  {record.createdAt ? ` · ${new Date(record.createdAt).toLocaleDateString()}` : ''}
                </p>

                {used.length > 0 ? (
                  <p className="mt-1.5 truncate text-[11px] text-emerald-700" title={used.join(', ')}>
                    In use · {used[0]}
                    {used.length > 1 ? ` +${used.length - 1}` : ''}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[11px] text-slate-400">Not referenced</p>
                )}

                <div className="mt-2.5 flex items-center gap-1">
                  <button
                    type="button"
                    className="btn-quiet btn-icon"
                    aria-label="Copy path"
                    onClick={() => copy(record)}
                  >
                    <IconCopy className="h-4 w-4" />
                  </button>
                  <a
                    href={record.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open full size"
                    className="btn-quiet btn-icon"
                  >
                    <IconExternal className="h-4 w-4" />
                  </a>
                  {canWrite && (
                    <button
                      type="button"
                      className="btn-quiet btn-icon ml-auto text-slate-400 hover:bg-brand-50 hover:text-brand"
                      aria-label={`Delete ${record.filename}`}
                      onClick={() => setConfirm(record)}
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload an image"
        description="Images are downscaled in your browser, then stored in the database."
        footer={
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setUploadOpen(false);
              router.refresh();
            }}
          >
            Done
          </button>
        }
      >
        <ImageUploader
          value={null}
          onChange={() => {
            router.refresh();
          }}
          folder="general"
          label="New image"
          hint="It lands in the library straight away — close this when you are finished."
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        busy={busy}
        title="Delete this image?"
        description={
          usedBy.length > 0
            ? `This image is still used by ${usedBy.join(', ')}. Deleting it will leave a broken image there.`
            : `“${confirm?.filename ?? ''}” will be permanently removed from the database.`
        }
        confirmLabel={usedBy.length > 0 ? 'Delete anyway' : 'Delete image'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && remove(confirm)}
      />
    </>
  );
}
