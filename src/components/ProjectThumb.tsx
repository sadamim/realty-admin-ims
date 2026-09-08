// Featured-image thumbnail with a typographic fallback.
// Uses a plain <img>: next/image is configured `unoptimized` anyway, and the
// legacy CDN paths are already absolute.
export default function ProjectThumb({
  name,
  image,
  size = 'h-10 w-10',
}: {
  name: string;
  image?: string | null;
  size?: string;
}) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();

  if (!image) {
    return (
      <span
        aria-hidden="true"
        className={`${size} flex shrink-0 items-center justify-center rounded-lg bg-navy-50 text-sm font-bold text-navy-400`}
      >
        {initial}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://realtyfocus.info/images/fimage/${image}`}
      alt=""
      loading="lazy"
      className={`${size} shrink-0 rounded-lg border border-slate-200 bg-slate-100 object-cover`}
    />
  );
}
