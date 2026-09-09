'use client';

// Create / edit one team member. The photo is optional — the About page falls
// back to the person's initial rather than an empty frame.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ImageUploader from '@/components/ImageUploader';
import { IconTrash } from '@/components/icons';
import type { TeamRecord } from '@/lib/team';

export default function TeamEditor({
  member,
  canWrite,
}: {
  member: TeamRecord | null;
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const isNew = !member;

  const [name, setName] = useState(member?.name ?? '');
  const [title, setTitle] = useState(member?.title ?? '');
  const [bio, setBio] = useState(member?.bio ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
  const [phone, setPhone] = useState(member?.phone ?? '');
  const [linkedin, setLinkedin] = useState(member?.linkedin ?? '');
  const [image, setImage] = useState<string | null>(member?.image || null);
  const [active, setActive] = useState(member?.active ?? true);

  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    if (!name.trim()) {
      setNameError('A name is required.');
      return;
    }
    setNameError(null);
    setBusy(true);

    try {
      const res = await fetch(isNew ? '/api/team' : `/api/team/${member!._id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, title, bio, email, phone, linkedin, image, active }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ kind: 'error', title: 'Save failed', description: data.error });
        return;
      }

      toast({
        kind: 'success',
        title: isNew ? 'Team member added' : 'Team member saved',
        description: active ? 'They are on the About page.' : 'Saved, but hidden from the site.',
      });
      router.push('/team');
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
      const res = await fetch(`/api/team/${member!._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast({ kind: 'error', title: 'Delete failed', description: data.error });
        return;
      }
      toast({ kind: 'success', title: 'Team member removed' });
      router.push('/team');
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="name">
                  Name<span className="ml-1 text-brand">*</span>
                </label>
                <input
                  id="name"
                  className={`input ${nameError ? 'border-brand focus:border-brand focus:ring-brand/15' : ''}`}
                  value={name}
                  disabled={!canWrite}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Sreenivasa K"
                />
                {nameError && <p className="field-error">{nameError}</p>}
              </div>
              <div>
                <label className="label" htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  className="input"
                  value={title}
                  disabled={!canWrite}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Founder & Principal Consultant"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="bio">
                Bio
              </label>
              <textarea
                id="bio"
                rows={6}
                className="input-area"
                value={bio}
                disabled={!canWrite}
                onChange={(event) => setBio(event.target.value)}
                placeholder="A short paragraph for the About page."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  value={email}
                  disabled={!canWrite}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  className="input"
                  value={phone}
                  disabled={!canWrite}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="linkedin">
                  LinkedIn
                </label>
                <input
                  id="linkedin"
                  className="input"
                  value={linkedin}
                  disabled={!canWrite}
                  onChange={(event) => setLinkedin(event.target.value)}
                  placeholder="https://linkedin.com/in/…"
                />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white/95 px-5 py-3.5 backdrop-blur sm:px-6">
            <button type="button" className="btn-primary" onClick={save} disabled={busy || !canWrite}>
              {busy && <Spinner className="h-4 w-4" />}
              {busy ? 'Saving…' : isNew ? 'Add team member' : 'Save changes'}
            </button>
            <Link href="/team" className="btn-ghost">
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
              folder="team"
              label="Photo"
              aspect="aspect-square"
              disabled={!canWrite}
              hint="Optional. A square headshot; the About page crops to a circle."
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
                  Hidden people stay here and are skipped by the About page.
                </span>
              </span>
            </label>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        busy={busy}
        title="Remove this team member?"
        description="They are removed from the database and disappear from the About page."
        confirmLabel="Remove"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </>
  );
}
