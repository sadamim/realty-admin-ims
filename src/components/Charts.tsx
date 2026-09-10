// Inline SVG charts. No charting library — the panel adds no dependencies, and
// two single-series charts do not justify one.
//
// Both charts follow the same rules:
//   * ONE series each, so there is no legend to read and no categorical palette
//     to get wrong; the heading names the series.
//   * One hue (the brand navy) — colour carries magnitude here, not identity, so
//     every bar is the same colour and never re-coloured by rank.
//   * Recessive axes and gridlines, thin marks, and labels in text colours
//     rather than the series colour.
//   * Values are direct-labelled where it helps, and every chart is backed by a
//     real table so the numbers are readable without seeing colour at all.
import type { SeriesPoint } from '@/lib/overview';

const INK = '#0b0729';
const SERIES = '#231a56';
const SERIES_SOFT = '#4a4285';
const GRID = '#e7e6f3';

const nice = (max: number) => {
  if (max <= 5) return 5;
  const pow = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / pow) * pow;
};

function DataTable({ rows, unit }: { rows: SeriesPoint[]; unit: string }) {
  return (
    <details className="mt-3 group">
      <summary className="cursor-pointer text-xs font-medium text-slate-400 transition-colors hover:text-slate-700">
        View as table
      </summary>
      <div className="table-scroll mt-2 max-h-52 overflow-y-auto">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-slate-100 last:border-0">
                <td className="py-1.5 pr-3 capitalize text-slate-600">{row.label}</td>
                <td className="py-1.5 text-right font-medium tabular-nums text-slate-900">
                  {row.value.toLocaleString()}
                  <span className="sr-only"> {unit}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
      <p className="px-6 text-center text-sm text-slate-400">{message}</p>
    </div>
  );
}

/** Enquiries over time. Change-over-time is a line, and the fill is decoration. */
export function EnquiriesTrend({ data }: { data: SeriesPoint[] }) {
  const total = data.reduce((sum, point) => sum + point.value, 0);

  if (data.length === 0 || total === 0) {
    return (
      <Empty message="No enquiries carry a usable date yet, so there is nothing to plot over time." />
    );
  }

  const W = 640;
  const H = 200;
  const PAD = { top: 16, right: 16, bottom: 28, left: 34 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const top = nice(Math.max(...data.map((d) => d.value)));
  const x = (i: number) => PAD.left + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)},${PAD.top + plotH} L${x(0).toFixed(1)},${PAD.top + plotH} Z`;

  const peakIndex = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);
  const lastIndex = data.length - 1;
  const ticks = [0, top / 2, top];

  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Enquiries per month. ${total} in total across the last ${data.length} months.`}
      >
        <defs>
          <linearGradient id="enq-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES} stopOpacity="0.16" />
            <stop offset="100%" stopColor={SERIES} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
              {Math.round(t)}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#enq-fill)" />
        <path d={line} fill="none" stroke={SERIES} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {data.map((d, i) => (
          <g key={d.label}>
            {/* A generous invisible target so the native tooltip is easy to hit. */}
            <circle cx={x(i)} cy={y(d.value)} r="12" fill="transparent">
              <title>{`${d.label}: ${d.value} ${d.value === 1 ? 'enquiry' : 'enquiries'}`}</title>
            </circle>
            {(i === peakIndex || i === lastIndex) && (
              <>
                <circle cx={x(i)} cy={y(d.value)} r="4" fill={SERIES} stroke="#fff" strokeWidth="2" />
                <text
                  x={x(i)}
                  y={y(d.value) - 10}
                  textAnchor={i === lastIndex ? 'end' : 'middle'}
                  fontSize="11"
                  fontWeight="600"
                  fill={INK}
                >
                  {d.value}
                </text>
              </>
            )}
          </g>
        ))}

        {data.map((d, i) =>
          i % 2 === 0 || i === lastIndex ? (
            <text key={`${d.label}-x`} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">
              {d.label}
            </text>
          ) : null,
        )}
      </svg>

      <DataTable rows={data} unit="enquiries" />
    </>
  );
}

/** Projects per builder. Long category names, so the bars run horizontally. */
export function BuilderWorkload({ data }: { data: SeriesPoint[] }) {
  if (data.length === 0) {
    return <Empty message="No project is linked to a builder yet, so there is nothing to compare." />;
  }

  const top = Math.max(...data.map((d) => d.value));

  return (
    <>
      <ul
        className="space-y-2.5"
        role="img"
        aria-label={`Projects per builder. ${data[0].label} leads with ${data[0].value}.`}
      >
        {data.map((d) => (
          <li key={d.label} className="grid grid-cols-[minmax(0,7rem)_1fr_2.5rem] items-center gap-3">
            <span className="truncate text-xs capitalize text-slate-600" title={d.label}>
              {d.label}
            </span>
            <span className="h-3 overflow-hidden rounded-sm bg-slate-100">
              <span
                className="block h-full rounded-sm"
                // One hue for every bar: the length already encodes the
                // magnitude, and re-colouring the leader would make colour mean
                // rank, which changes as soon as the data does.
                style={{ width: `${Math.max(2, (d.value / top) * 100)}%`, backgroundColor: SERIES_SOFT }}
              />
            </span>
            <span className="text-right text-xs font-semibold tabular-nums text-slate-900">
              {d.value.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>

      <DataTable rows={data} unit="projects" />
    </>
  );
}
