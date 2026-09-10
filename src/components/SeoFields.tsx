'use client';

// Optional search-engine overrides, shared by the blog and builder editors.
//
// Both fields are optional on purpose: leaving them empty is the right default,
// because the website already derives a title and description from the record
// itself. These exist for the cases where the derived one reads badly.
//
// The counters are the point of the component — Google truncates titles around
// 60 characters and descriptions around 155, and there is no way to know you
// have overrun without being told.
import { useId } from 'react';

const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 155;

function Counter({ value, limit }: { value: string; limit: number }) {
  const n = value.trim().length;
  if (n === 0) return <span className="text-slate-400">Optional</span>;
  return (
    <span className={n > limit ? 'font-medium text-brand' : 'text-slate-400'}>
      {n} / {limit}
      {n > limit ? ' — will be cut off' : ''}
    </span>
  );
}

export default function SeoFields({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  disabled = false,
  fallbackTitle,
  fallbackDescription,
}: {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  disabled?: boolean;
  /** What the website will use when the field is left empty. */
  fallbackTitle?: string;
  fallbackDescription?: string;
}) {
  const titleId = useId();
  const descriptionId = useId();

  const previewTitle = title.trim() || fallbackTitle?.trim() || 'Untitled';
  const previewDescription =
    description.trim() || fallbackDescription?.trim() || 'No description yet.';

  return (
    <section className="divider pt-5">
      <h2 className="section-title">Search engines</h2>
      <p className="muted mt-0.5">
        Leave both empty and the page describes itself from the content above.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label className="label" htmlFor={titleId}>
              Meta title
            </label>
            <span className="mb-1.5 text-xs">
              <Counter value={title} limit={TITLE_LIMIT} />
            </span>
          </div>
          <input
            id={titleId}
            className="input"
            value={title}
            disabled={disabled}
            maxLength={70}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder={fallbackTitle || 'The headline shown in search results'}
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label className="label" htmlFor={descriptionId}>
              Meta description
            </label>
            <span className="mb-1.5 text-xs">
              <Counter value={description} limit={DESCRIPTION_LIMIT} />
            </span>
          </div>
          <textarea
            id={descriptionId}
            rows={3}
            className="input-area"
            value={description}
            disabled={disabled}
            maxLength={200}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder={fallbackDescription?.slice(0, 120) || 'The two lines under the title'}
          />
        </div>

        {/* Roughly how the result reads. Not pixel-accurate — Google rewrites
            these often — but enough to catch a title that makes no sense out of
            context. */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Search preview
          </p>
          <p className="mt-2 truncate text-[15px] text-[#1a0dab]">{previewTitle}</p>
          <p className="text-xs text-[#006621]">realtyfocus.info</p>
          <p className="mt-0.5 line-clamp-2 text-[13px] text-slate-600">{previewDescription}</p>
        </div>
      </div>
    </section>
  );
}
