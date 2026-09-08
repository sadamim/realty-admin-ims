import Link from 'next/link';
import { IconSearch } from '@/components/icons';

export default function NotFound() {
  return (
    <div className="card animate-fade-up flex flex-col items-center px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
        <IconSearch className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-slate-900">Record not found</h1>
      <p className="mt-1.5 max-w-md text-sm text-slate-500">
        It may have been removed, or the id in the URL is not a valid ObjectId.
      </p>
      <Link href="/microsites" className="btn-primary mt-6">
        Back to projects
      </Link>
    </div>
  );
}
