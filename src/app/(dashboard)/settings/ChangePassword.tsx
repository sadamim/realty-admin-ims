'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import Spinner from '@/components/ui/Spinner';

export default function ChangePassword({ userId }: { userId: string }) {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setError(null);
    setBusy(true);

    try {
      const res = await fetch(`/api/admins/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'The server rejected the change.');
        toast({ kind: 'error', title: 'Password not changed', description: data.error });
        return;
      }

      setPassword('');
      setConfirm('');
      toast({
        kind: 'success',
        title: 'Password changed',
        description: 'Use the new one next time you sign in.',
      });
    } catch {
      setError('Could not reach the server.');
      toast({ kind: 'error', title: 'Could not reach the server' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <label className="label" htmlFor="new-password">
            New password
          </label>
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="mb-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
        <input
          id="new-password"
          type={show ? 'text' : 'password'}
          className="input"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="confirm-password">
          Confirm password
        </label>
        <input
          id="confirm-password"
          type={show ? 'text' : 'password'}
          className="input"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-brand-100 bg-brand-50 px-3.5 py-2.5 text-sm text-brand-600">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary" disabled={busy}>
        {busy && <Spinner className="h-4 w-4" />}
        {busy ? 'Saving…' : 'Change password'}
      </button>
    </form>
  );
}
