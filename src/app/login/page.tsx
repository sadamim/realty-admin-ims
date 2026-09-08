import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Sign in — Realty Focus Admin' };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy px-14 py-14 text-white lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/[0.04]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/[0.03]"
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-bold">
            RF
          </span>
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
            Realty Focus
          </span>
        </div>

        <div className="relative animate-fade-up">
          <h1 className="max-w-md text-[40px] font-bold leading-[1.1] tracking-[-0.02em]">
            The admin panel for everything you publish.
          </h1>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/60">
            Projects, builders, pricing, floor plans and amenities — managed in one place, straight
            against the live database.
          </p>
        </div>

        <p className="relative text-xs text-white/40">
          Sessions last 8 hours and are signed with an httpOnly cookie.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-14 sm:px-10">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-sm font-bold text-white">
              RF
            </span>
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Realty Focus
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-[-0.01em] text-slate-900">Sign in</h2>
          <p className="mt-1.5 text-sm text-slate-500">Use your administrator account.</p>

          <Suspense fallback={<div className="skeleton mt-8 h-64 w-full rounded-xl" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
