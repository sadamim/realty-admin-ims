import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMicrosite } from '@/lib/admin-data';
import MicrositeForm from './MicrositeForm';
import ProjectThumb from '@/components/ProjectThumb';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconLayers,
  IconMapPin,
  IconRupee,
  IconSparkles,
} from '@/components/icons';

export const dynamic = 'force-dynamic';

const money = (value: unknown) => {
  const n = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(n) || n === 0) return '—';
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(2)} L`;
  return n.toLocaleString();
};

export default async function MicrositeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getMicrosite(id);
  if (!data) notFound();

  const { microsite, details, prices, floorPlans, amenities, options } = data as any;
  const place = [microsite.location, microsite.city].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/microsites"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>

        <div className="mt-3 flex flex-wrap items-start gap-4">
          <ProjectThumb
            name={microsite.name}
            image={details?.featured_image}
            size="h-14 w-14 sm:h-16 sm:w-16"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-[26px] font-bold leading-tight tracking-[-0.01em] text-slate-900">
              {microsite.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="badge-neutral">
                Legacy id <code className="ml-1 font-mono">{microsite.micro_id}</code>
              </span>
              {place && (
                <span className="badge-neutral capitalize">
                  <IconMapPin className="h-3 w-3" />
                  {place}
                </span>
              )}
              {microsite.project_type && microsite.project_type !== 'none' && (
                <span className="badge-info capitalize">{microsite.project_type}</span>
              )}
              {!details && (
                <span className="badge-warning">
                  <IconAlertTriangle className="h-3 w-3" />
                  No detail row
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <MicrositeForm
          id={id}
          microsite={microsite}
          details={details}
          builders={options.builders}
          statuses={options.statuses}
          types={options.types}
        />

        <div className="space-y-5">
          <Panel title="Pricing" count={prices.length} icon={<IconRupee className="h-4 w-4" />}>
            {prices.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-slate-500">No price rows for this project.</p>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="th">Type</th>
                      <th className="th">Sq.ft</th>
                      <th className="th text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices.slice(0, 12).map((p: any) => (
                      <tr key={p._id} className="row">
                        <td className="td py-2 capitalize">{p.type || '—'}</td>
                        <td className="td py-2 tabular-nums">{p.sqft || '—'}</td>
                        <td className="td py-2 text-right font-medium tabular-nums text-slate-900">
                          {money(p.basic_cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {prices.length > 12 && (
                  <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-400">
                    +{prices.length - 12} more rows
                  </p>
                )}
              </>
            )}
          </Panel>

          <Panel title="Floor plans" count={floorPlans.length} icon={<IconLayers className="h-4 w-4" />}>
            {floorPlans.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-slate-500">No floor plans linked.</p>
            ) : (
              <ul className="px-5 pb-5 pt-1 text-sm">
                {floorPlans.slice(0, 10).map((f: any) => (
                  <li
                    key={f._id}
                    className="flex items-center gap-2 border-b border-slate-100 py-2 last:border-0 last:pb-0"
                  >
                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-navy-200" />
                    <span className="truncate text-slate-600">{f.title || f.image}</span>
                  </li>
                ))}
                {floorPlans.length > 10 && (
                  <li className="pt-2 text-xs text-slate-400">+{floorPlans.length - 10} more</li>
                )}
              </ul>
            )}
          </Panel>

          <Panel title="Amenities" count={amenities.length} icon={<IconSparkles className="h-4 w-4" />}>
            {amenities.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-slate-500">None linked to this project.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 px-5 pb-5">
                {amenities.map((a: any) => (
                  <span key={a._id} className="badge-neutral">
                    {a.name}
                  </span>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  count,
  icon,
  children,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-50 text-navy">
          {icon}
        </span>
        <h2 className="section-title flex-1">{title}</h2>
        <span className="badge-neutral tabular-nums">{count}</span>
      </div>
      {children}
    </section>
  );
}
