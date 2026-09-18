import Link from 'next/link';
import { getCounts } from '@/lib/admin-data';
import { getExtraCounts, getLeadsByMonth, getProjectsPerBuilder } from '@/lib/overview';
import { getSessionUser } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import CountUp from '@/components/ui/CountUp';
import { visibleItems } from '@/components/nav-items';
import { BuilderWorkload, EnquiriesTrend } from '@/components/Charts';
import {
  IconBuilding,
  IconChevronRight,
  IconSkyline,
  IconImage,
  IconInbox,
  IconInfo,
  IconLayers,
  IconNews,
  IconQuote,
  IconRupee,
  IconSparkles,
  IconUsers,
  type IconProps,
} from '@/components/icons';

export const dynamic = 'force-dynamic';

interface Tile {
  key: string;
  label: string;
  value: number;
  note: string;
  href?: string;
  icon: (props: IconProps) => React.ReactElement;
}

/** Ratios are computed from the same counts — nothing here is invented. */
const ratio = (a: number, b: number) => (b > 0 ? (a / b).toFixed(1) : '0');

export default async function DashboardPage() {
  const [counts, extra, user, leadsByMonth, builderWorkload] = await Promise.all([
    getCounts(),
    getExtraCounts(),
    getSessionUser(),
    getLeadsByMonth(),
    getProjectsPerBuilder(),
  ]);

  const primary: Tile[] = [
    {
      key: 'microsites',
      label: 'Projects',
      value: counts.microsites,
      note: `${ratio(counts.prices, counts.microsites)} price rows per project`,
      href: '/microsites',
      icon: IconBuilding,
    },
    {
      key: 'leads',
      label: 'Enquiries',
      value: counts.leads,
      note:
        counts.leads === 0
          ? 'No leads captured yet'
          : extra.newLeads > 0
            ? `${extra.newLeads.toLocaleString()} awaiting a reply`
            : 'All caught up',
      href: '/enquiries',
      icon: IconInbox,
    },
    {
      key: 'blogs',
      label: 'Articles',
      value: counts.blogs,
      note: counts.blogs > 0 ? 'Posts in the blog collection' : 'No articles published yet',
      href: '/blogs',
      icon: IconNews,
    },
    {
      key: 'builders',
      label: 'Builders',
      value: counts.builders,
      note: `${ratio(counts.microsites, counts.builders)} projects per builder`,
      href: '/builders',
      icon: IconSkyline,
    },
  ];

  const secondary: Tile[] = [
    {
      key: 'banners',
      label: 'Banners',
      value: extra.banners,
      note: 'Hero slides',
      href: '/banners',
      icon: IconImage,
    },
    {
      key: 'testimonials',
      label: 'Testimonials',
      value: extra.testimonials,
      note: 'Client quotes',
      href: '/testimonials',
      icon: IconQuote,
    },
    { key: 'prices', label: 'Price rows', value: counts.prices, note: 'Configurations', icon: IconRupee },
    {
      key: 'floorPlans',
      label: 'Floor plans',
      value: counts.floorPlans,
      note: 'Plan images',
      icon: IconLayers,
    },
    {
      key: 'amenities',
      label: 'Amenities',
      value: counts.amenities,
      note: 'Shared library',
      href: '/amenities',
      icon: IconSparkles,
    },
    {
      key: 'admins',
      label: 'Admin users',
      value: counts.admins,
      note: 'Panel accounts',
      href: '/admins',
      icon: IconUsers,
    },
  ];

  const shortcuts = visibleItems(user?.role).filter((item) => item.href !== '/');

  return (
    <div className="min-w-0 space-y-8">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Live counts read straight from the realtyfocus database."
        actions={
          <Link href="/blogs/new" className="btn-primary btn-sm">
            <IconNews className="h-4 w-4" />
            Write a post
          </Link>
        }
      />

      <section aria-label="Key statistics" className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {primary.map((tile, index) => (
          <StatCard key={tile.key} tile={tile} index={index} />
        ))}
      </section>

      <section
        aria-label="Catalogue depth"
        className="grid gap-4 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6"
      >
        {secondary.map((tile, index) => (
          <StatCard key={tile.key} tile={tile} index={index + 4} compact />
        ))}
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="card animate-fade-up p-5" style={{ animationDelay: '420ms' }}>
          <h2 className="section-title">Enquiries per month</h2>
          <p className="muted mt-0.5">
            The last 12 months, from the <code className="code-chip">leads</code> collection.
          </p>
          <div className="mt-4">
            <EnquiriesTrend data={leadsByMonth} />
          </div>
        </div>

        <div className="card animate-fade-up p-5" style={{ animationDelay: '470ms' }}>
          <h2 className="section-title">Busiest builders</h2>
          <p className="muted mt-0.5">Projects linked to each developer.</p>
          <div className="mt-4">
            <BuilderWorkload data={builderWorkload} />
          </div>
        </div>
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="card animate-fade-up p-5" style={{ animationDelay: '520ms' }}>
          <h2 className="section-title">Jump back in</h2>
          <p className="muted mt-1">Everything your role can reach.</p>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {shortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition duration-200 ease-smooth hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-card-hover"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy transition-colors duration-200 group-hover:bg-navy group-hover:text-white">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">{item.label}</span>
                      <span className="block truncate text-xs text-slate-500">{item.hint}</span>
                    </span>
                    <IconChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-500" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card animate-fade-up p-5" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center gap-2">
            <IconInfo className="h-4 w-4 text-navy-400" />
            <h2 className="section-title">How this data is wired</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex gap-2.5">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-300" />
              <span>
                Project relationships run through the original MySQL keys stored as strings —{' '}
                <code className="code-chip">micro_id</code>, <code className="code-chip">builder_id</code> —
                not <code className="code-chip">_id</code>.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-300" />
              <span>
                Blogs and banners publish straight to the website. Drafts and hidden slides stay here.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-300" />
              <span>
                Uploaded images live in the <code className="code-chip">media</code> collection and are
                served by both apps from <code className="code-chip">/api/media/…</code>, so nothing is
                written to disk on Vercel.
              </span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function StatCard({ tile, index, compact = false }: { tile: Tile; index: number; compact?: boolean }) {
  const Icon = tile.icon;

  const body = (
    <div
      className={`card-interactive h-full animate-fade-up ${compact ? 'p-4' : 'p-5'}`}
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex items-center justify-center rounded-xl bg-navy-50 text-navy ${
            compact ? 'h-8 w-8' : 'h-10 w-10'
          }`}
        >
          <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
        </span>
        {tile.href && <IconChevronRight className="mt-1 h-4 w-4 text-slate-300" aria-hidden="true" />}
      </div>

      <p
        className={`mt-4 font-bold tabular-nums tracking-[-0.02em] text-slate-900 ${
          compact ? 'text-2xl' : 'text-[32px] leading-none'
        }`}
      >
        <CountUp value={tile.value} delay={index * 55} />
      </p>
      <p className="mt-1.5 text-sm font-semibold text-slate-700">{tile.label}</p>
      <p className="mt-0.5 text-xs text-slate-400">{tile.note}</p>
    </div>
  );

  return tile.href ? (
    <Link href={tile.href} className="block h-full min-w-0 break-words focus-visible:rounded-card">
      {body}
    </Link>
  ) : (
    <div className="h-full min-w-0 break-words">{body}</div>
  );
}
