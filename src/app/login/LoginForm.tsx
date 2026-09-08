'use client';

// The authentication flow is untouched: POST /api/auth/login, then a client
// navigation so middleware picks up the freshly-set session cookie.
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import Spinner from '@/components/ui/Spinner';
import { IconAlertCircle } from '@/components/icons';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const next = searchParams.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        const message = data.error ?? 'Sign in failed.';
        setError(message);
        toast({ kind: 'error', title: 'Sign in failed', description: message });
        setBusy(false);
        return;
      }

      toast({ kind: 'success', title: 'Signed in', description: 'Loading your dashboard…' });

      // Full navigation so the new cookie is picked up by middleware.
      router.push(next);
      router.refresh();
    } catch {
      const message = 'Could not reach the server.';
      setError(message);
      toast({ kind: 'error', title: 'Network error', description: message });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="input"
          autoComplete="username"
          placeholder="you@realtyfocus.info"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="label" htmlFor="password">
            Password
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="mb-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <input
          id="password"
          type={showPassword ? 'text' : 'password'}
          className="input"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50 px-3.5 py-2.5 text-sm text-brand-600 animate-fade-in"
        >
          <IconAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy && <Spinner className="h-4 w-4" />}
        {busy ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="pt-2 text-center text-xs text-slate-400">
        Trouble signing in? Reset an account with{' '}
        <code className="code-chip">npm run create-admin</code>
      </p>
    </form>
  );
}
