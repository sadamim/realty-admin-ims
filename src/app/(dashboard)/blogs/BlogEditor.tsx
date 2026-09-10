'use client';

// Create/edit form for a blog post. One component serves both routes so the
// two screens can never drift apart.
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ImageUploader from '@/components/ImageUploader';
import SeoFields from '@/components/SeoFields';
import { SITE_URL } from '@/lib/site';
import { IconExternal, IconTrash } from '@/components/icons';
import type { BlogRecord } from '@/lib/blogs';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90);

const toDateInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

export default function BlogEditor({
  blog,
  categories,
  canWrite,
}: {
  blog: BlogRecord | null;
  categories: string[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const isNew = !blog;

  const [title, setTitle] = useState(blog?.title ?? '');
  const [slug, setSlug] = useState(blog?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(blog?.slug));
  const [category, setCategory] = useState(blog?.category ?? '');
  const [author, setAuthor] = useState(blog?.author ?? 'RealtyFocus Team');
  const [status, setStatus] = useState<'published' | 'draft'>(blog?.status ?? 'draft');
  const [publishedAt, setPublishedAt] = useState(toDateInput(blog?.publishedAt ?? null));
  const [excerpt, setExcerpt] = useState(blog?.excerpt ?? '');
  const [metaTitle, setMetaTitle] = useState(blog?.metaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(blog?.metaDescription ?? '');
  const [body, setBody] = useState(blog?.body ?? '');
  const [image, setImage] = useState<string | null>(blog?.image ?? null);

  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const effectiveSlug = slugTouched ? slug : slugify(title);
  const wordCount = useMemo(
    () => body.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length,
    [body],
  );

  async function save() {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = 'A title is required.';
    if (!excerpt.trim() && !body.trim()) nextErrors.body = 'Add an excerpt or some body text.';
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      toast({ kind: 'warning', title: 'Check the form', description: 'Some fields still need attention.' });
      return;
    }

    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        slug: effectiveSlug,
        excerpt: excerpt.trim(),
        body,
        image,
        category: category.trim(),
        author: author.trim(),
        status,
        publishedAt: publishedAt ? new Date(`${publishedAt}T00:00:00`).toISOString() : null,
        metaTitle,
        metaDescription,
      };

      const res = await fetch(isNew ? '/api/blogs' : `/api/blogs/${blog!._id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ kind: 'error', title: 'Save failed', description: data.error ?? 'The server rejected the change.' });
        return;
      }

      toast({
        kind: 'success',
        title: isNew ? 'Post created' : 'Post saved',
        description: status === 'published' ? 'It is live on the website.' : 'Saved as a draft.',
      });

      if (isNew) router.push(`/blogs/${data.id}`);
      router.refresh();
    } catch {
      toast({ kind: 'error', title: 'Could not reach the server', description: 'Check your connection and try again.' });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/blogs/${blog!._id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        toast({ kind: 'error', title: 'Delete failed', description: data.error ?? 'The server rejected the request.' });
        return;
      }
      toast({ kind: 'success', title: 'Post deleted', description: `“${blog!.title}” has been removed.` });
      router.push('/blogs');
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
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="card overflow-hidden">
          <div className="space-y-5 p-5 sm:p-6">
            <div>
              <label className="label" htmlFor="title">
                Title<span className="ml-1 text-brand">*</span>
              </label>
              <input
                id="title"
                className={`input ${errors.title ? 'border-brand focus:border-brand focus:ring-brand/15' : ''}`}
                value={title}
                disabled={!canWrite}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="How to choose the right property in Bangalore"
              />
              {errors.title && <p className="field-error">{errors.title}</p>}
            </div>

            <div>
              <label className="label" htmlFor="slug">
                URL slug
              </label>
              <div className="flex items-center gap-2">
                <span className="hidden shrink-0 text-xs text-slate-400 sm:block">/blogs/</span>
                <input
                  id="slug"
                  className="input font-mono text-[13px]"
                  value={effectiveSlug}
                  disabled={!canWrite}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(event.target.value);
                  }}
                />
              </div>
              <p className="field-hint">
                Generated from the title until you edit it. Duplicates get a number appended.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="excerpt">
                Excerpt
              </label>
              <textarea
                id="excerpt"
                rows={3}
                className="input-area"
                value={excerpt}
                disabled={!canWrite}
                onChange={(event) => setExcerpt(event.target.value)}
                placeholder="One or two sentences shown on the blog listing card."
              />
              <p className="field-hint">Left empty, the first 180 characters of the body are used.</p>
            </div>

            <div>
              <div className="flex items-end justify-between">
                <label className="label" htmlFor="body">
                  Body
                </label>
                <span className="mb-1.5 text-xs text-slate-400">
                  {wordCount} words · ~{Math.max(1, Math.round(wordCount / 200))} min read
                </span>
              </div>
              <textarea
                id="body"
                rows={18}
                className={`input-area font-normal ${errors.body ? 'border-brand focus:border-brand focus:ring-brand/15' : ''}`}
                value={body}
                disabled={!canWrite}
                onChange={(event) => setBody(event.target.value)}
                placeholder={'Write in plain text.\n\nBlank lines start a new paragraph.\n## A heading\n**bold**, *italic* and [links](https://example.com) work.'}
              />
              {errors.body ? (
                <p className="field-error">{errors.body}</p>
              ) : (
                <p className="field-hint">
                  Plain text with light Markdown: <code className="code-chip">##</code> headings,{' '}
                  <code className="code-chip">**bold**</code>, <code className="code-chip">*italic*</code>,{' '}
                  <code className="code-chip">[text](url)</code>. Existing HTML posts still render as HTML.
                </p>
              )}
            </div>
          </div>

          <div className="px-5 pb-5 sm:px-6">
            <SeoFields
              title={metaTitle}
              description={metaDescription}
              onTitleChange={setMetaTitle}
              onDescriptionChange={setMetaDescription}
              disabled={!canWrite}
              fallbackTitle={title}
              fallbackDescription={excerpt}
            />
          </div>

          <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white/95 px-5 py-3.5 backdrop-blur sm:px-6">
            <button type="button" className="btn-primary" onClick={save} disabled={busy || !canWrite}>
              {busy && <Spinner className="h-4 w-4" />}
              {busy ? 'Saving…' : isNew ? 'Create post' : 'Save changes'}
            </button>
            <Link href="/blogs" className="btn-ghost">
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
            <h2 className="section-title">Publishing</h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="label" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  className="input-select"
                  value={status}
                  disabled={!canWrite}
                  onChange={(event) => setStatus(event.target.value as 'published' | 'draft')}
                >
                  <option value="published">Published — visible on the site</option>
                  <option value="draft">Draft — hidden from the site</option>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="publishedAt">
                  Publish date
                </label>
                <input
                  id="publishedAt"
                  type="date"
                  className="input"
                  value={publishedAt}
                  disabled={!canWrite}
                  onChange={(event) => setPublishedAt(event.target.value)}
                />
              </div>

              <div>
                <label className="label" htmlFor="category">
                  Category
                </label>
                <input
                  id="category"
                  className="input"
                  list="blog-categories"
                  value={category}
                  disabled={!canWrite}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="Market Trends"
                />
                <datalist id="blog-categories">
                  {categories.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="label" htmlFor="author">
                  Author
                </label>
                <input
                  id="author"
                  className="input"
                  value={author}
                  disabled={!canWrite}
                  onChange={(event) => setAuthor(event.target.value)}
                />
              </div>
            </div>

            {!isNew && status === 'published' && (
              <a
                href={`${SITE_URL}/blogs/${effectiveSlug}`}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost btn-sm mt-4 w-full"
              >
                <IconExternal className="h-3.5 w-3.5" />
                View on the website
              </a>
            )}
          </section>

          <section className="card p-5">
            <h2 className="section-title mb-3">Cover image</h2>
            <ImageUploader
              value={image}
              onChange={setImage}
              folder="blog"
              label="Cover"
              aspect="aspect-[4/3]"
              disabled={!canWrite}
              hint="Shown on the blog listing card and at the top of the post."
            />
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        busy={busy}
        title="Delete this post?"
        description={`“${blog?.title ?? ''}” will be removed from the database and disappear from the website. This cannot be undone.`}
        confirmLabel="Delete post"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </>
  );
}
