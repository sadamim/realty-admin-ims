'use client';

// Create / edit one testimonial. The photo is optional: the website falls back
// to the person's initial, so a quote can be published without chasing a
// headshot first.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ImageUploader from '@/components/ImageUploader';
import { IconStar, IconTrash } from '@/components/icons';
import type { TestimonialRecord } from '@/lib/testimonials';

export default function TestimonialEditor({
  testimonial,
  canWrite,
}: {
  testimonial: TestimonialRecord | null;
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const isNew = !testimonial;

  const [name, setName] = useState(testimonial?.name ?? '');
  const [role, setRole] = useState(testimonial?.role ?? '');
  const [location, setLocation] = useState(testimonial?.location ?? '');
  const [project, setProject] = useState(testimonial?.project ?? '');
  const [quote, setQuote] = useState(testimonial?.quote ?? '');
  const [rating, setRating] = useState(testimonial?.rating ?? 5);
  const [image, setImage] = useState<string | null>(testimonial?.image || null);
  const [active, setActive] = useState(testimonial?.active ?? true);

  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; quote?: string }>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    const next: { name?: string; quote?: string } = {};
    if (!name.trim()) next.name = 'A name is required.';
    if (!quote.trim()) next.quote = 'The testimonial text is required.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const res = await fetch(
        isNew ? '/api/testimonials' : `/api/testimonials/${testimonial!._id}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, role, location, project, quote, rating, image, active }),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        toast({ kind: 'error', title: 'Save failed', description: data.error });
        return;
      }

      toast({
        kind: 'success',
        title: isNew ? 'Testimonial added' : 'Testimonial saved',
        description: active ? 'It is live on the website.' : 'Saved, but hidden from the site.',
      });
      router.push('/testimonials');
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
      const res = await fetch(`/api/testimonials/${testimonial!._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast({ kind: 'error', title: 'Delete failed', description: data.error });
        return;
      }
      toast({ kind: 'success', title: 'Testimonial deleted' });
      router.push('/testimonials');
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
                  className={`input ${errors.name ? 'border-brand focus:border-brand focus:ring-brand/15' : ''}`}
                  value={name}
                  disabled={!canWrite}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Anita Rao"
                />
                {errors.name && <p className="field-error">{errors.name}</p>}
              </div>
              <div>
                <label className="label" htmlFor="role">
                  Role or description
                </label>
                <input
                  id="role"
                  className="input"
                  value={role}
                  disabled={!canWrite}
                  onChange={(event) => setRole(event.target.value)}
                  placeholder="Home buyer"
                />
              </div>
              <div>
                <label className="label" htmlFor="location">
                  Location
                </label>
                <input
                  id="location"
                  className="input"
                  value={location}
                  disabled={!canWrite}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Whitefield, Bangalore"
                />
              </div>
              <div>
                <label className="label" htmlFor="project">
                  Project
                </label>
                <input
                  id="project"
                  className="input"
                  value={project}
                  disabled={!canWrite}
                  onChange={(event) => setProject(event.target.value)}
                  placeholder="Prestige Lakeside Habitat"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="quote">
                Testimonial<span className="ml-1 text-brand">*</span>
              </label>
              <textarea
                id="quote"
                rows={6}
                className="input-area"
                value={quote}
                disabled={!canWrite}
                onChange={(event) => setQuote(event.target.value)}
                placeholder="What they said, in their words."
              />
              {errors.quote ? (
                <p className="field-error">{errors.quote}</p>
              ) : (
                <p className="field-hint">Two or three sentences read best on the website.</p>
              )}
            </div>

            <div>
              <span className="label block">Rating</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    disabled={!canWrite}
                    onClick={() => setRating(index + 1)}
                    aria-label={`${index + 1} star${index === 0 ? '' : 's'}`}
                    aria-pressed={rating === index + 1}
                    className="rounded p-1 transition hover:bg-slate-100 disabled:pointer-events-none"
                  >
                    <IconStar
                      className={`h-5 w-5 ${index < rating ? 'text-amber-400' : 'text-slate-200'}`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm tabular-nums text-slate-500">{rating} / 5</span>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white/95 px-5 py-3.5 backdrop-blur sm:px-6">
            <button type="button" className="btn-primary" onClick={save} disabled={busy || !canWrite}>
              {busy && <Spinner className="h-4 w-4" />}
              {busy ? 'Saving…' : isNew ? 'Add testimonial' : 'Save changes'}
            </button>
            <Link href="/testimonials" className="btn-ghost">
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
              folder="testimonial"
              label="Photo"
              aspect="aspect-square"
              disabled={!canWrite}
              hint="Optional. Without one the website shows the person's initial."
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
                  Hidden testimonials stay here and are skipped by the homepage section.
                </span>
              </span>
            </label>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        busy={busy}
        title="Delete this testimonial?"
        description="It is removed from the database and disappears from the website."
        confirmLabel="Delete testimonial"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </>
  );
}
