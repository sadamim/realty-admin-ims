'use client';

// Create a project.
//
// Deliberately a SHORT form: name, where it is, who is building it and a
// picture. Everything else — pricing, floor plans, the long description — is on
// the full edit screen, which this redirects to as soon as the project exists.
// A project is two documents (microsite + microsite_detail); the API writes
// both, so a project created here never lands in the "no detail row" state the
// edit form has to warn about for imported data.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import Spinner from '@/components/ui/Spinner';
import ImageUploader from '@/components/ImageUploader';
import type { MicrositeOptions } from '@/lib/admin-data';

export default function MicrositeCreateForm({ options }: { options: MicrositeOptions }) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [projectType, setProjectType] = useState('none');
  const [builderId, setBuilderId] = useState('');
  const [statusId, setStatusId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [rooms, setRooms] = useState('');
  const [price, setPrice] = useState('');
  const [possession, setPossession] = useState('');
  const [about, setAbout] = useState('');
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) {
      setNameError('A project name is required.');
      return;
    }
    setNameError(null);
    setBusy(true);

    try {
      const res = await fetch('/api/microsites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          location,
          city,
          project_type: projectType,
          possession,
          builder_id: builderId,
          status_id: statusId,
          type_id: typeId,
          rooms,
          price,
          about,
          featured_image: featuredImage ?? '',
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ kind: 'error', title: 'Could not create the project', description: data.error });
        return;
      }

      toast({
        kind: 'success',
        title: 'Project created',
        description:
          projectType === 'none'
            ? `${name} is live on the website. Tag it featured or trending to put it on the homepage.`
            : `${name} is live and will appear in the ${projectType} slider.`,
      });
      // Straight into the full editor — pricing and floor plans live there.
      router.push(`/microsites/${data.id}`);
      router.refresh();
    } catch {
      toast({ kind: 'error', title: 'Could not reach the server' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="card overflow-hidden">
        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <label className="label" htmlFor="name">
              Project name<span className="ml-1 text-brand">*</span>
            </label>
            <input
              id="name"
              className={`input ${nameError ? 'border-brand focus:border-brand focus:ring-brand/15' : ''}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Prestige Lakeside Habitat"
            />
            {nameError && <p className="field-error">{nameError}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                className="input"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Whitefield"
              />
            </div>
            <div>
              <label className="label" htmlFor="city">
                City
              </label>
              <input
                id="city"
                className="input"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="builder_id">
                Builder
              </label>
              <select
                id="builder_id"
                className="input-select"
                value={builderId}
                onChange={(event) => setBuilderId(event.target.value)}
              >
                <option value="">— none —</option>
                {options.builders.map((builder) => (
                  <option key={builder.builder_id} value={builder.builder_id}>
                    {builder.name}
                  </option>
                ))}
              </select>
              <p className="field-hint">
                Missing one?{' '}
                <Link href="/builders/new" className="font-medium text-navy hover:underline">
                  Add a builder
                </Link>
                .
              </p>
            </div>
            <div>
              <label className="label" htmlFor="type_id">
                Property type
              </label>
              <select
                id="type_id"
                className="input-select"
                value={typeId}
                onChange={(event) => setTypeId(event.target.value)}
              >
                <option value="">— none —</option>
                {options.types.map((type) => (
                  <option key={type.type_id} value={type.type_id}>
                    {type.type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="status_id">
                Status
              </label>
              <select
                id="status_id"
                className="input-select"
                value={statusId}
                onChange={(event) => setStatusId(event.target.value)}
              >
                <option value="">— none —</option>
                {options.statuses.map((status) => (
                  <option key={status.status_id} value={status.status_id}>
                    {status.status || '(blank)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="possession">
                Possession
              </label>
              <input
                id="possession"
                className="input"
                value={possession}
                onChange={(event) => setPossession(event.target.value)}
                placeholder="Dec 2027"
              />
            </div>

            <div>
              <label className="label" htmlFor="rooms">
                Configuration
              </label>
              <input
                id="rooms"
                className="input"
                value={rooms}
                onChange={(event) => setRooms(event.target.value)}
                placeholder="2bhk,3bhk"
              />
              <p className="field-hint">Comma separated.</p>
            </div>
            <div>
              <label className="label" htmlFor="price">
                Price label
              </label>
              <input
                id="price"
                className="input"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="₹ 1.2 Cr onwards"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="about">
              About
            </label>
            <textarea
              id="about"
              rows={7}
              className="input-area"
              value={about}
              onChange={(event) => setAbout(event.target.value)}
              placeholder="The description shown on the project page."
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white/95 px-5 py-3.5 backdrop-blur sm:px-6">
          <button type="button" className="btn-primary" onClick={save} disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />}
            {busy ? 'Creating…' : 'Create project'}
          </button>
          <Link href="/microsites" className="btn-ghost">
            Cancel
          </Link>
          <span className="ml-auto text-xs text-slate-400">
            Pricing and floor plans come next, on the edit screen.
          </span>
        </div>
      </div>

      <div className="space-y-5">
        <section className="card p-5">
          <ImageUploader
            value={featuredImage}
            onChange={setFeaturedImage}
            folder="project"
            label="Featured image"
            aspect="aspect-[4/3]"
            hint="Shown on every project card. Landscape, around 1200×900."
          />
        </section>

        <section className="card p-5">
          <h2 className="section-title">Homepage placement</h2>
          <p className="muted mt-0.5">Where this project shows up, beyond the projects page.</p>
          <div className="mt-4 space-y-2">
            {[
              { value: 'none', label: 'Projects page only', hint: 'Listed at /projects.' },
              { value: 'featured', label: 'Featured', hint: 'Also in the homepage featured slider.' },
              { value: 'Trending', label: 'Trending', hint: 'Also in the homepage trending slider.' },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  projectType === option.value
                    ? 'border-navy bg-navy-50/60'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="project_type"
                  value={option.value}
                  checked={projectType === option.value}
                  onChange={(event) => setProjectType(event.target.value)}
                  className="mt-0.5 h-4 w-4 border-slate-300 text-navy focus:ring-navy/30"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900">{option.label}</span>
                  <span className="block text-xs text-slate-500">{option.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
