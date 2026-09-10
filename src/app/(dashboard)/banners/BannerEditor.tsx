'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ImageUploader from '@/components/ImageUploader';
import { IconTrash } from '@/components/icons';
import type { BannerRecord } from '@/lib/banners';

export default function BannerEditor({
  banner,
  canWrite,
}: {
  banner: BannerRecord | null;
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const isNew = !banner;

  const [title, setTitle] = useState(banner?.title ?? '');
  const [subtitle, setSubtitle] = useState(banner?.subtitle ?? '');
  const [ctaLabel, setCtaLabel] = useState(banner?.ctaLabel ?? '');
  const [ctaHref, setCtaHref] = useState(banner?.ctaHref ?? '');
  const [active, setActive] = useState(banner?.active ?? true);
  const [image, setImage] = useState<string | null>(banner?.image ?? null);
  const [imageTablet, setImageTablet] = useState<string | null>(banner?.imageTablet ?? null);
  const [imageMobile, setImageMobile] = useState<string | null>(banner?.imageMobile ?? null);

  const [busy, setBusy] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    if (!image) {
      setImageError('A banner needs an image.');
      toast({ kind: 'warning', title: 'Add an image', description: 'The hero slide cannot render without one.' });
      return;
    }
    setImageError(null);
    setBusy(true);

    try {
      const res = await fetch(isNew ? '/api/banners' : `/api/banners/${banner!._id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle,
          ctaLabel,
          ctaHref,
          active,
          image,
          imageTablet,
          imageMobile,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ kind: 'error', title: 'Save failed', description: data.error ?? 'The server rejected the change.' });
        return;
      }

      toast({
        kind: 'success',
        title: isNew ? 'Banner created' : 'Banner saved',
        description: active ? 'It is live on the homepage hero.' : 'Saved, but hidden from the site.',
      });
      router.push('/banners');
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
      const res = await fetch(`/api/banners/${banner!._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast({ kind: 'error', title: 'Delete failed', description: data.error });
        return;
      }
      toast({ kind: 'success', title: 'Banner deleted' });
      router.push('/banners');
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
              <ImageUploader
                value={image}
                onChange={(next) => {
                  setImage(next);
                  setImageError(null);
                }}
                folder="banner"
                label="Desktop image"
                required
                aspect="aspect-[21/9]"
                disabled={!canWrite}
                hint="Wide landscape — the hero crops to fill. Around 2000×900."
              />
              {imageError && <p className="field-error">{imageError}</p>}

              {/* Optional narrower crops. A wide hero image loses its subject
                  when a phone crops it to a tall sliver, which is the whole
                  reason these exist — but they stay optional, and an empty slot
                  simply reuses the desktop image. */}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ImageUploader
                  value={imageTablet}
                  onChange={setImageTablet}
                  folder="banner"
                  label="Tablet image"
                  aspect="aspect-[4/3]"
                  disabled={!canWrite}
                  hint="Used under 1024px wide. Optional."
                />
                <ImageUploader
                  value={imageMobile}
                  onChange={setImageMobile}
                  folder="banner"
                  label="Mobile image"
                  aspect="aspect-[9/16]"
                  disabled={!canWrite}
                  hint="Used under 640px wide. Optional."
                />
              </div>

              <p className="field-hint mt-2">
                {imageTablet || imageMobile
                  ? 'The website picks the narrowest matching image for the visitor\u2019s screen.'
                  : 'Only the desktop image is set, so every screen gets that one.'}
              </p>
            </div>

            <div className="divider pt-5">
              <h2 className="section-title">Overlay text</h2>
              <p className="muted mt-0.5">
                Leave both empty to keep the website&apos;s existing headline and use this purely as a
                background image.
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="label" htmlFor="title">
                    Headline
                  </label>
                  <input
                    id="title"
                    className="input"
                    value={title}
                    disabled={!canWrite}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Find the address that feels like home."
                  />
                </div>

                <div>
                  <label className="label" htmlFor="subtitle">
                    Supporting line
                  </label>
                  <textarea
                    id="subtitle"
                    rows={3}
                    className="input-area"
                    value={subtitle}
                    disabled={!canWrite}
                    onChange={(event) => setSubtitle(event.target.value)}
                    placeholder="Hand-picked apartments, villas and plots from Bangalore's most trusted builders."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="ctaLabel">
                      Button label
                    </label>
                    <input
                      id="ctaLabel"
                      className="input"
                      value={ctaLabel}
                      disabled={!canWrite}
                      onChange={(event) => setCtaLabel(event.target.value)}
                      placeholder="Explore projects"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="ctaHref">
                      Button link
                    </label>
                    <input
                      id="ctaHref"
                      className="input"
                      value={ctaHref}
                      disabled={!canWrite}
                      onChange={(event) => setCtaHref(event.target.value)}
                      placeholder="/projects"
                    />
                    <p className="field-hint">A path like /projects, or a full https:// URL.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white/95 px-5 py-3.5 backdrop-blur sm:px-6">
            <button type="button" className="btn-primary" onClick={save} disabled={busy || !canWrite}>
              {busy && <Spinner className="h-4 w-4" />}
              {busy ? 'Saving…' : isNew ? 'Create banner' : 'Save changes'}
            </button>
            <Link href="/banners" className="btn-ghost">
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
                  Inactive slides stay here but are skipped by the homepage hero.
                </span>
              </span>
            </label>
          </section>

          <section className="card overflow-hidden">
            <div className="px-5 py-4">
              <h2 className="section-title">Preview</h2>
              <p className="muted mt-0.5">Roughly how the hero will read.</p>
            </div>
            <div className="relative aspect-[16/10] w-full bg-navy-900">
              {image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" className="h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-navy-900/80 via-navy-900/40 to-navy-900/90" />
              <div className="absolute inset-0 flex flex-col justify-center p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                  Bangalore · Premium Residences
                </p>
                <p className="mt-2 text-lg font-bold leading-tight text-white">
                  {title || 'Find the address that feels like home.'}
                </p>
                {subtitle && (
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-white/70">{subtitle}</p>
                )}
                {ctaLabel && (
                  <span className="mt-3 inline-flex w-fit rounded-md bg-brand px-3 py-1.5 text-[11px] font-semibold text-white">
                    {ctaLabel}
                  </span>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        busy={busy}
        title="Delete this banner?"
        description="The slide is removed from the database and disappears from the homepage hero."
        confirmLabel="Delete banner"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </>
  );
}
