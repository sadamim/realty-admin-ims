'use client';

// Create / edit one builder. Same shape as BannerEditor: a single card, a
// sticky action bar, and delete behind a confirmation.
//
// The delete button can come back with a 409 when projects still point at this
// builder — that message is shown as-is, because it tells the user exactly how
// many projects are in the way.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ImageUploader from '@/components/ImageUploader';
import { IconTrash } from '@/components/icons';
import type { BuilderRecord } from '@/lib/builders';

export default function BuilderEditor({
  builder,
  canWrite,
}: {
  builder: BuilderRecord | null;
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const isNew = !builder;

  const [name, setName] = useState(builder?.name ?? '');
  const [logo, setLogo] = useState<string | null>(builder?.logo || null);
  const [address, setAddress] = useState(builder?.address ?? '');
  const [description, setDescription] = useState(builder?.description ?? '');
  const [established, setEstablished] = useState(builder?.established ?? '');
  const [completedProjects, setCompletedProjects] = useState(builder?.completedProjects ?? '');
  const [ongoingProjects, setOngoingProjects] = useState(builder?.ongoingProjects ?? '');
  const [locations, setLocations] = useState((builder?.locations ?? []).join(', '));
  const [website, setWebsite] = useState(builder?.website ?? '');
  const [active, setActive] = useState(builder?.active ?? true);

  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    if (!name.trim()) {
      setNameError('A builder name is required.');
      return;
    }
    setNameError(null);
    setBusy(true);

    try {
      const res = await fetch(isNew ? '/api/builders' : `/api/builders/${builder!._id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          logo,
          address,
          description,
          established,
          completedProjects,
          ongoingProjects,
          locations,
          website,
          active,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ kind: 'error', title: 'Save failed', description: data.error ?? 'The server rejected the change.' });
        return;
      }

      toast({
        kind: 'success',
        title: isNew ? 'Builder created' : 'Builder saved',
        description: isNew
          ? `Projects can now be linked to ${name}.`
          : `${name} has been updated.`,
      });
      router.push('/builders');
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
      const res = await fetch(`/api/builders/${builder!._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast({ kind: 'error', title: 'Cannot delete this builder', description: data.error });
        return;
      }
      toast({ kind: 'success', title: 'Builder deleted' });
      router.push('/builders');
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
                Builder name<span className="ml-1 text-brand">*</span>
              </label>
              <input
                id="name"
                className={`input ${nameError ? 'border-brand focus:border-brand focus:ring-brand/15' : ''}`}
                value={name}
                disabled={!canWrite}
                onChange={(event) => setName(event.target.value)}
                placeholder="Prestige Group"
              />
              {nameError && <p className="field-error">{nameError}</p>}
            </div>

            <div>
              <label className="label" htmlFor="description">
                About
              </label>
              <textarea
                id="description"
                rows={5}
                className="input-area"
                value={description}
                disabled={!canWrite}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="A short paragraph shown on the builder card on the website."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="established">
                  Established
                </label>
                <input
                  id="established"
                  className="input"
                  value={established}
                  disabled={!canWrite}
                  onChange={(event) => setEstablished(event.target.value)}
                  placeholder="1986"
                />
              </div>
              <div>
                <label className="label" htmlFor="website">
                  Website
                </label>
                <input
                  id="website"
                  className="input"
                  value={website}
                  disabled={!canWrite}
                  onChange={(event) => setWebsite(event.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div>
                <label className="label" htmlFor="completedProjects">
                  Completed projects
                </label>
                <input
                  id="completedProjects"
                  className="input"
                  value={completedProjects}
                  disabled={!canWrite}
                  onChange={(event) => setCompletedProjects(event.target.value)}
                  placeholder="250+"
                />
              </div>
              <div>
                <label className="label" htmlFor="ongoingProjects">
                  Ongoing projects
                </label>
                <input
                  id="ongoingProjects"
                  className="input"
                  value={ongoingProjects}
                  disabled={!canWrite}
                  onChange={(event) => setOngoingProjects(event.target.value)}
                  placeholder="30+"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="locations">
                  Cities
                </label>
                <input
                  id="locations"
                  className="input"
                  value={locations}
                  disabled={!canWrite}
                  onChange={(event) => setLocations(event.target.value)}
                  placeholder="Bangalore, Chennai, Hyderabad"
                />
                <p className="field-hint">Comma separated. Shown as tags on the website.</p>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="address">
                  Head office address
                </label>
                <input
                  id="address"
                  className="input"
                  value={address}
                  disabled={!canWrite}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white/95 px-5 py-3.5 backdrop-blur sm:px-6">
            <button type="button" className="btn-primary" onClick={save} disabled={busy || !canWrite}>
              {busy && <Spinner className="h-4 w-4" />}
              {busy ? 'Saving…' : isNew ? 'Create builder' : 'Save changes'}
            </button>
            <Link href="/builders" className="btn-ghost">
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
              value={logo}
              onChange={setLogo}
              folder="builder"
              label="Logo"
              aspect="aspect-[4/3]"
              disabled={!canWrite}
              hint="A square-ish logo on a plain background reads best on the builder card."
            />
          </section>

          <section className="card p-5">
            <h2 className="section-title">Visibility</h2>
            <label className="mt-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={active}
                disabled={!canWrite}
                onChange={(event) => setActive(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy/30"
              />
              <span>
                <span className="block text-sm font-medium text-slate-900">Show on the website</span>
                <span className="block text-xs text-slate-500">
                  Hiding a builder removes its card from the builders page. Projects linked to it are
                  not affected.
                </span>
              </span>
            </label>
          </section>

          {!isNew && (
            <section className="card p-5">
              <h2 className="section-title">Linked records</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Projects</dt>
                  <dd className="font-semibold tabular-nums text-slate-900">
                    {builder!.projectCount}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Legacy id</dt>
                  <dd className="font-mono text-xs text-slate-500">{builder!.builder_id || '—'}</dd>
                </div>
              </dl>
              {builder!.projectCount > 0 && (
                <p className="muted mt-3">
                  Projects link to this builder through{' '}
                  <code className="code-chip">builder_id</code>, so it cannot be deleted while any
                  remain.
                </p>
              )}
            </section>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        busy={busy}
        title="Delete this builder?"
        description="The builder is removed from the database. Projects that still link to it would lose their builder name, so the delete is refused while any exist."
        confirmLabel="Delete builder"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </>
  );
}
