import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">404</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-500">
          The page you were looking for does not exist in the admin panel.
        </p>
        <Link href="/" className="btn-primary mt-6">
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
