// src/lib/overview.ts
// SERVER ONLY.
// Counts for the sections added after the original build. getCounts() in
// admin-data.ts is left exactly as it was; this sits alongside it.
import type { Document } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { countBanners } from '@/lib/banners';
import { countNewLeads } from '@/lib/leads';
import { countIn } from '@/lib/ordered';
import { TESTIMONIAL_COLLECTION } from '@/lib/testimonials';

export interface ExtraCounts {
  banners: number;
  newLeads: number;
  testimonials: number;
}

export async function getExtraCounts(): Promise<ExtraCounts> {
  const [banners, newLeads, testimonials] = await Promise.all([
    countBanners(),
    countNewLeads(),
    countIn(TESTIMONIAL_COLLECTION),
  ]);
  return { banners, newLeads, testimonials };
}

/* -------------------------------------------------------------------------- */
/* Series for the dashboard charts                                            */
/*                                                                            */
/* Both are aggregated in Mongo and returned already shaped for the chart, so  */
/* the page does no arithmetic. Both swallow errors and return an empty series */
/* — a dashboard that renders without a chart is better than one that 500s.    */
/* -------------------------------------------------------------------------- */

export interface SeriesPoint {
  label: string;
  value: number;
}

/**
 * Enquiries per month for the last 12 months, including months with none.
 *
 * The imported leads use several different date columns, so the date is coalesced
 * the same way normaliseLead() does it, then converted — rows whose date will not
 * parse are dropped rather than being bucketed into a wrong month.
 */
export async function getLeadsByMonth(months = 12): Promise<SeriesPoint[]> {
  const db = await getDb();

  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCMonth(start.getUTCMonth() - (months - 1));

  const rows = await db
    .collection('leads')
    .aggregate([
      {
        $addFields: {
          _when: {
            $convert: {
              input: {
                $ifNull: [
                  '$createdAt',
                  { $ifNull: ['$created_at', { $ifNull: ['$date', { $ifNull: ['$enquiry_date', '$added_on'] }] }] },
                ],
              },
              to: 'date',
              onError: null,
              onNull: null,
            },
          },
        },
      },
      { $match: { _when: { $gte: start } } },
      { $group: { _id: { y: { $year: '$_when' }, m: { $month: '$_when' } }, n: { $sum: 1 } } },
    ])
    .toArray()
    .catch(() => [] as Document[]);

  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(`${row._id?.y}-${row._id?.m}`, Number(row.n ?? 0));
  }

  // Build every bucket so a quiet month is a zero on the axis, not a gap.
  const series: SeriesPoint[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < months; i += 1) {
    const y = cursor.getUTCFullYear();
    const m = cursor.getUTCMonth() + 1;
    series.push({
      label: cursor.toLocaleDateString('en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
      value: counts.get(`${y}-${m}`) ?? 0,
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return series;
}

/** The busiest developers, by how many projects link to them. */
export async function getProjectsPerBuilder(limit = 8): Promise<SeriesPoint[]> {
  const db = await getDb();

  const rows = await db
    .collection('microsite_detail')
    .aggregate([
      { $match: { builder_id: { $nin: [null, ''] } } },
      { $group: { _id: '$builder_id', n: { $sum: 1 } } },
      { $sort: { n: -1 } },
      { $limit: limit },
      { $lookup: { from: 'builder', localField: '_id', foreignField: 'builder_id', as: 'builder' } },
      { $set: { builder: { $arrayElemAt: ['$builder', 0] } } },
      { $project: { n: 1, name: { $ifNull: ['$builder.name', 'Unknown builder'] } } },
    ])
    .toArray()
    .catch(() => [] as Document[]);

  return rows.map((row) => ({ label: String(row.name ?? 'Unknown'), value: Number(row.n ?? 0) }));
}
