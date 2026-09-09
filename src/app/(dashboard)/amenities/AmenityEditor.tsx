'use client';

// Create / edit one amenity.
//
// Deleting also strips the amenity's id out of every project's comma-separated
// am_id list — that happens server-side; the confirmation copy says so, and the
// project count on this screen is how many lists will be rewritten.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ImageUploader from '@/components/ImageUploader';
import { IconTrash } from '@/components/icons';
import type { AmenityRecord } from '@/lib/amenities';

export default function AmenityEditor({
  amenity,
  canWrite,
}: {
  amenity: AmenityRecord | null;
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const isNew = !amenity;

  const [name, setName] = useState(amenity?.name ?? '');
  const [category, setCategory] = useState(amenity?.category ?? '');
  const [image, setImage] = useState<string | null>(amenity?.image || null);

  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    if (!name.trim()) {
      setNameError('An amenity name is required.');
      return;
    }
    setNameError(null);
    setBusy(true);

    try {
      const res = await fetch(isNew ? '/api/amenities' : `/api/amenities/${amenity!._id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, image }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ kind: 'error', title: 'Save failed', description: data.error });
        return;
      }

      toast({
        kind: 'success',
        title: isNew ? 'Amenity created' : 'Amenity saved',
        description: isNew ? `${name} is now available to every project.` : `${name} has been updated.`,
      });
      router.push('/amenities');
      router.refresh();
    } catch {
      toast({ kind: 'error', title: 'Could not reach the server' });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/amenities/${amenity!._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast({ kind: 'error', title: 'Delete failed', description: data.error });
        return;
      }
      toast({
        kind: 'success',
        title: 'Amenity deleted',
        description: data.cleaned
          ? `Removed from ${data.cleaned} project${data.cleaned === 1 ? '' : 's'}.`
          : undefined,
      });
      router.push('/amenities');
      router.refresh();
    } catch {
      toast({ kind: 'error', title: 'Could not reach the server' });
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="card overflow-hidden">
          <div className="space-y-5 p-5 sm:p-6">
            <div>
              <label className="label" htmlFor="name">
                Amenity name<span className="ml-1 text-brand">*</span>
              </label>
              <input
                id="name"
                className={`input ${nameError ? 'border-brand focus:border-brand focus:ring-brand/15' : ''}`}
                value={name}
                disabled={!canWrite}
                onChange={(event) => setName(event.target.value)}
                placeholder="Swimming pool"
              />
              {nameError && <p className="field-error">{nameError}</p>}
            </div>

            <div>
              <label className="label" htmlFor="category">
                Group
              </label>
              <input
                id="category"
                className="input"
                value={category}
                disabled={!canWrite}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Sports, Leisure, Safety…"
              />
              <p className="field-hint">Optional. Only used to keep this list tidy.</p>
            </div>
          </div>

          <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white/95 px-5 py-3.5 backdrop-blur sm:px-6">
            <button type="button" className="btn-primary" onClick={save} disabled={busy || !canWrite}>
              {busy && <Spinner className="h-4 w-4" />}
              {busy ? 'Saving…' : isNew ? 'Create amenity' : 'Save changes'}
            </button>
            <Link href="/amenities" className="btn-ghost">
              Cancel
            </Link>

            {!isNew && canWrite && (
              <button
                type="button"
                className="btn-quiet btn-sm ml-auto text-brand hover:bg-brand-50 hover:text-brand-600"
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
              >
                <IconTrash className="h-4 w-4" />
                Delete
              </button>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <section className="card p-5">
            <ImageUploader
              value={image}
              onChange={setImage}
              folder="amenity"
              label="Icon"
              aspect="aspect-square"
              disabled={!canWrite}
              hint="Square icons look right — the website renders them in a circle."
            />
          </section>

          {!isNew && (
            <section className="card p-5">
              <h2 className="section-title">Usage</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Projects using it</dt>
                  <dd className="font-semibold tabular-nums text-slate-900">
                    {amenity!.projectCount}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Legacy id</dt>
                  <dd className="font-mono text-xs text-slate-500">{amenity!.am_id || '—'}</dd>
                </div>
              </dl>
              <p className="muted mt-3">
                Projects reference amenities through the comma-separated{' '}
                <code className="code-chip">am_id</code> list on their detail row.
              </p>
            </section>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        busy={busy}
        title="Delete this amenity?"
        description={
          amenity && amenity.projectCount > 0
            ? `It will also be removed from the ${amenity.projectCount} project${amenity.projectCount === 1 ? '' : 's'} that list it, so nothing is left pointing at a missing amenity.`
            : 'The amenity is removed from the database.'
        }
        confirmLabel="Delete amenity"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </>
  );
}
