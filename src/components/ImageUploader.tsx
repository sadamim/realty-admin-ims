'use client';

// Drag-and-drop image field.
//
// Images are downscaled in the browser before upload (max 1920px, quality
// 0.85) so what lands in MongoDB stays small — no server-side image library and
// no extra dependency. The stored value is the "/api/media/<id>" path, which
// resolves on both this panel and the public site. Pasting an absolute URL
// still works for images that live on the legacy CDN.
import { useCallback, useId, useRef, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import Spinner from '@/components/ui/Spinner';
import { IconClose, IconImage, IconUpload } from '@/components/icons';
import { LEGACY_FOLDER_FOR, resolveImageSrc, type MediaFolder } from '@/lib/image-url';

const MAX_DIMENSION = 1920;
const SKIP_RESIZE_BELOW = 700_000;

async function downscale(file: File): Promise<Blob> {
  // GIF would lose its animation and AVIF is already small; leave both alone.
  if (file.type === 'image/gif' || file.type === 'image/avif') return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('That file could not be read as an image.'));
      element.src = objectUrl;
    });

    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
    if (scale === 1 && file.size <= SKIP_RESIZE_BELOW) return file;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);

    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function ImageUploader({
  value,
  onChange,
  folder = 'general',
  label = 'Image',
  hint,
  aspect = 'aspect-[16/9]',
  required = false,
  disabled = false,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  folder?: MediaFolder;
  label?: string;
  hint?: string;
  aspect?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const toast = useToast();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // A field may still hold an imported filename ("photo.jpg") rather than an
  // uploaded path, so the preview resolves it against the legacy CDN folder for
  // this section. The stored value itself is never rewritten.
  const previewSrc = resolveImageSrc(value, LEGACY_FOLDER_FOR[folder]);

  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');

  const upload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast({ kind: 'warning', title: 'Not an image', description: `${file.name} was skipped.` });
        return;
      }

      setBusy(true);
      try {
        const blob = await downscale(file);
        const form = new FormData();
        form.append('file', blob, file.name);
        form.append('folder', folder);

        const res = await fetch('/api/media', { method: 'POST', body: form });
        const data = await res.json();

        if (!res.ok) {
          toast({ kind: 'error', title: 'Upload failed', description: data.error ?? 'The server rejected the image.' });
          return;
        }

        onChange(data.media.url);
        toast({
          kind: 'success',
          title: 'Image uploaded',
          description: `${Math.round(data.media.size / 1024)} KB stored.`,
        });
      } catch {
        toast({ kind: 'error', title: 'Upload failed', description: 'Could not reach the server.' });
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [folder, onChange, toast],
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="label" htmlFor={inputId}>
          {label}
          {required && <span className="ml-1 text-brand">*</span>}
        </label>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setUrlMode((v) => !v);
            setUrlDraft(value ?? '');
          }}
          className="mb-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
        >
          {urlMode ? 'Upload a file' : 'Use a URL'}
        </button>
      </div>

      {urlMode ? (
        <div className="flex gap-2">
          <input
            className="input"
            value={urlDraft}
            disabled={disabled}
            placeholder="https://realtyfocus.info/images/… or /api/media/…"
            onChange={(event) => setUrlDraft(event.target.value)}
          />
          <button
            type="button"
            className="btn-ghost shrink-0"
            disabled={disabled}
            onClick={() => {
              onChange(urlDraft.trim() || null);
              setUrlMode(false);
            }}
          >
            Use
          </button>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (disabled) return;
            const file = event.dataTransfer.files?.[0];
            if (file) void upload(file);
          }}
          className={`relative flex ${aspect} w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed
            transition duration-200 ease-smooth ${
              dragging
                ? 'border-navy bg-navy-50'
                : 'border-slate-300 bg-slate-50 hover:border-slate-400'
            } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        >
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewSrc ?? ''} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-2 image-upload-actions bg-ink/0 opacity-0 transition duration-200 ease-smooth hover:bg-ink/45 hover:opacity-100 focus-within:bg-ink/45 focus-within:opacity-100">
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => inputRef.current?.click()}
                >
                  <IconUpload className="h-3.5 w-3.5" />
                  Replace
                </button>
                <button
                  type="button"
                  className="btn-danger btn-sm"
                  onClick={() => onChange(null)}
                >
                  <IconClose className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center gap-2 px-6 py-8 text-center"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400">
                {busy ? <Spinner className="h-5 w-5" /> : <IconImage className="h-5 w-5" />}
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {busy ? 'Uploading…' : 'Drop an image, or click to browse'}
              </span>
              <span className="text-xs text-slate-400">JPEG, PNG, WebP, GIF or AVIF · up to 4 MB</span>
            </button>
          )}

          {busy && value && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Spinner className="h-6 w-6 text-navy" />
            </div>
          )}
        </div>
      )}

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      {hint && <p className="field-hint">{hint}</p>}
      {value && !urlMode && (
        <p className="field-hint truncate font-mono text-[11px]">{value}</p>
      )}
    </div>
  );
}
