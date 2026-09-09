'use client';

// The save path is unchanged: FormData -> plain object -> PUT /api/microsites/:id.
// Disabled inputs are still omitted by FormData, so a project without a
// microsite_detail row sends exactly the same payload it did before.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import Spinner from '@/components/ui/Spinner';
import ImageUploader from '@/components/ImageUploader';
import { IconAlertTriangle } from '@/components/icons';

interface Props {
  id: string;
  microsite: Record<string, any>;
  details: Record<string, any> | null;
  builders: Array<{ builder_id: string; name: string }>;
  statuses: Array<{ status_id: string; status: string }>;
  types: Array<{ type_id: string; type: string }>;
}

export default function MicrositeForm({ id, microsite, details, builders, statuses, types }: Props) {
  const router = useRouter();
  const toast = useToast();

  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [featuredImage, setFeaturedImage] = useState<string>(details?.featured_image ?? '');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    if (!String(payload.name ?? '').trim()) {
      setNameError('A project name is required.');
      toast({ kind: 'warning', title: 'Check the form', description: 'Project name cannot be empty.' });
      return;
    }
    setNameError(null);
    setBusy(true);

    try {
      const res = await fetch(`/api/microsites/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        toast({
          kind: 'error',
          title: 'Session expired',
          description: 'Sign in again to keep editing.',
        });
        router.push('/login');
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        toast({ kind: 'error', title: 'Save failed', description: data.error ?? 'The server rejected the change.' });
      } else {
        setDirty(false);
        toast({
          kind: 'success',
          title: 'Changes saved',
          description: `${String(payload.name ?? 'Project')} has been updated.`,
        });
        router.refresh();
      }
    } catch {
      toast({
        kind: 'error',
        title: 'Could not reach the server',
        description: 'Check your connection and try again.',
      });
    } finally {
      setBusy(false);
    }
  }

  const d = details ?? {};

  return (
    <form
      onSubmit={onSubmit}
      onChange={() => setDirty(true)}
      onReset={() => {
        setDirty(false);
        setNameError(null);
        setFeaturedImage(details?.featured_image ?? '');
      }}
      className="card overflow-hidden"
    >
      <div className="space-y-8 p-5 sm:p-6">
        <section>
          <SectionHeading
            title="Project"
            description="Stored on the microsite document itself."
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Name"
              name="name"
              defaultValue={microsite.name}
              required
              error={nameError}
              className="sm:col-span-2"
            />
            <Field
              label="Project tag"
              name="project_type"
              defaultValue={microsite.project_type}
              hint="featured / Trending / none — drives the homepage sliders"
            />
            <Field label="Location" name="location" defaultValue={microsite.location} />
            <Field label="Sub location" name="sub_location" defaultValue={microsite.sub_location} />
            <Field label="City" name="city" defaultValue={microsite.city} />
            <Field label="Zone" name="zone" defaultValue={microsite.zone} />
            <Field label="RERA no." name="rera_no" defaultValue={microsite.rera_no} />
            <Field label="Possession" name="possession" defaultValue={microsite.possession} />
            <Field label="Total area" name="total_area" defaultValue={microsite.total_area} />
            <Field label="No. of units" name="no_of_units" defaultValue={microsite.no_of_units} />
          </div>
        </section>

        <section className="divider pt-8">
          <SectionHeading
            title="Details"
            description="Stored on the linked microsite_detail row."
          />

          {!details && (
            <p className="mt-3 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
              <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                This project has no row in <code className="code-chip">microsite_detail</code>, so
                these fields are read-only and are not submitted.
              </span>
            </p>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Select
              label="Builder"
              name="builder_id"
              defaultValue={d.builder_id}
              disabled={!details}
              options={builders.map((b) => ({ value: b.builder_id, label: b.name }))}
            />
            <Select
              label="Status"
              name="status_id"
              defaultValue={d.status_id}
              disabled={!details}
              options={statuses.map((s) => ({ value: s.status_id, label: s.status || '(blank)' }))}
            />
            <Select
              label="Property type"
              name="type_id"
              defaultValue={d.type_id}
              disabled={!details}
              options={types.map((t) => ({ value: t.type_id, label: t.type }))}
            />
            <Field
              label="Configuration (rooms)"
              name="rooms"
              defaultValue={d.rooms}
              disabled={!details}
              hint="Comma separated, e.g. 2bhk,3bhk"
            />
            <Field label="Price label" name="price" defaultValue={d.price} disabled={!details} />
            <Field label="Built area" name="built_area" defaultValue={d.built_area} disabled={!details} />
            <Field label="Phone" name="phone" defaultValue={d.phone} disabled={!details} />
            <Field label="Email" name="email" type="email" defaultValue={d.email} disabled={!details} />
            <Field label="Address" name="address" defaultValue={d.address} disabled={!details} className="sm:col-span-2" />
            <Field label="Latitude" name="latitude" defaultValue={d.latitude} disabled={!details} inputMode="decimal" />
            <Field label="Longitude" name="longitude" defaultValue={d.longitude} disabled={!details} inputMode="decimal" />
          </div>

          {/* Featured image.
              The value still travels in the same FormData field, through a
              hidden input that carries the uploader's state — including its
              `disabled` flag, so a project with no detail row submits exactly
              what it submitted before: nothing. Legacy values are bare
              filenames; the uploader resolves those against the old CDN for the
              preview and leaves the stored value alone until it is replaced. */}
          <div className="mt-4 max-w-md">
            <ImageUploader
              value={featuredImage || null}
              onChange={(next) => {
                setFeaturedImage(next ?? '');
                setDirty(true);
              }}
              folder="project"
              label="Featured image"
              aspect="aspect-[4/3]"
              disabled={!details}
              hint="Shown on every project card and at the top of the project page."
            />
            <input type="hidden" name="featured_image" value={featuredImage} disabled={!details} />
          </div>

          <div className="mt-4">
            <label className="label" htmlFor="about">
              About
            </label>
            <textarea
              id="about"
              name="about"
              rows={9}
              defaultValue={d.about ?? ''}
              disabled={!details}
              className="input-area"
            />
          </div>
        </section>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 flex items-center gap-3 border-t border-slate-200 bg-white/95 px-5 py-3.5 backdrop-blur sm:px-6">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy && <Spinner className="h-4 w-4" />}
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        <button type="reset" className="btn-ghost" disabled={busy}>
          Reset
        </button>

        <span className="ml-auto text-xs text-slate-400" role="status">
          {busy ? 'Writing to MongoDB…' : dirty ? 'Unsaved changes' : 'All changes saved'}
        </span>
      </div>
    </form>
  );
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  hint,
  required,
  disabled,
  error,
  type = 'text',
  inputMode,
  className = '',
}: {
  label: string;
  name: string;
  defaultValue?: any;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  type?: string;
  inputMode?: 'text' | 'decimal' | 'numeric';
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>
        {label}
        {required && <span className="ml-1 text-brand">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        defaultValue={defaultValue ?? ''}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`input ${error ? 'border-brand focus:border-brand focus:ring-brand/15' : ''}`}
      />
      {error ? (
        <p id={`${name}-error`} className="field-error">
          {error}
        </p>
      ) : (
        hint && <p className="field-hint">{hint}</p>
      )}
    </div>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue?: any;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={String(defaultValue ?? '')}
        disabled={disabled}
        className="input-select"
      >
        <option value="">— none —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
