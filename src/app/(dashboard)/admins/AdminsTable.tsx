'use client';

// Search and sorting run in the browser over the rows the server already sent.
// The management actions (create, edit, reset, delete) go through /api/admins,
// which enforces the same permission checks again on the server.
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { ASSIGNABLE_ROLES, roleLabel } from '@/lib/permissions';
import EmptyState from '@/components/ui/EmptyState';
import {
  IconChevronDown,
  IconEdit,
  IconKey,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUsers,
} from '@/components/icons';

type SortKey = 'username' | 'email' | 'role' | 'status' | 'last_login';

const COLUMNS: Array<{ key: SortKey; label: string }> = [
  { key: 'username', label: 'Username' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'last_login', label: 'Last login' },
];

const fullName = (a: any) => [a.f_name, a.l_name].filter(Boolean).join(' ');

function sortValue(row: any, key: SortKey) {
  if (key === 'last_login') return row.last_login ? new Date(row.last_login).getTime() : 0;
  if (key === 'status') return String(row.status) === '0' ? 0 : 1;
  return String(row[key] ?? '').toLowerCase();
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
function generatePassword(length = 16) {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => ALPHABET[value % ALPHABET.length]).join('');
}

interface FormState {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  password: string;
  status: '0' | '1';
}

const emptyForm: FormState = {
  email: '',
  username: '',
  firstName: '',
  lastName: '',
  role: 'subadmin',
  password: '',
  status: '1',
};

export default function AdminsTable({
  admins,
  canManage,
  currentUserId,
}: {
  admins: any[];
  canManage: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'username',
    dir: 'asc',
  });

  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [resetting, setResetting] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = term
      ? admins.filter((a) =>
          [a.username, a.email, a.role, fullName(a)]
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(term)),
        )
      : admins;

    return [...filtered].sort((a, b) => {
      const left = sortValue(a, sort.key);
      const right = sortValue(b, sort.key);
      if (left === right) return 0;
      const order = left > right ? 1 : -1;
      return sort.dir === 'asc' ? order : -order;
    });
  }, [admins, query, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((current) =>
      current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    );

  async function send(url: string, method: string, body: unknown, successTitle: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'The server rejected the request.');
        toast({ kind: 'error', title: 'Action failed', description: data.error });
        return false;
      }

      toast({ kind: 'success', title: successTitle });
      router.refresh();
      return true;
    } catch {
      setError('Could not reach the server.');
      toast({ kind: 'error', title: 'Could not reach the server' });
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or role…"
            aria-label="Search admin users"
            className="input pl-9"
          />
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">
            <span className="font-medium tabular-nums text-slate-700">{rows.length}</span> of{' '}
            <span className="tabular-nums">{admins.length}</span> accounts
          </p>
          {canManage && (
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => {
                setForm({ ...emptyForm, password: generatePassword() });
                setError(null);
                setCreateOpen(true);
              }}
            >
              <IconPlus className="h-4 w-4" />
              New admin
            </button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card mt-4">
          <EmptyState
            icon={IconUsers}
            title="No accounts match that search"
            description="Search runs across username, full name, email and role."
          />
        </div>
      ) : (
        <>
          <div className="table-wrap mt-4 hidden md:block">
            <div className="table-scroll">
              <table className="w-full min-w-[860px] border-collapse">
                <thead>
                  <tr>
                    {COLUMNS.map((column) => {
                      const active = sort.key === column.key;
                      return (
                        <th key={column.key} className="th p-0">
                          <button
                            type="button"
                            onClick={() => toggleSort(column.key)}
                            aria-label={`Sort by ${column.label}`}
                            className={`flex w-full items-center gap-1.5 px-4 py-3 text-left transition-colors hover:text-slate-900 ${
                              active ? 'text-slate-900' : ''
                            }`}
                          >
                            {column.label}
                            <IconChevronDown
                              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                active ? (sort.dir === 'asc' ? 'rotate-180 text-navy' : 'text-navy') : 'opacity-0'
                              }`}
                            />
                          </button>
                        </th>
                      );
                    })}
                    {canManage && <th className="th w-px" />}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => {
                    const isSelf = String(a._id) === currentUserId;
                    return (
                      <tr key={a._id} className="row">
                        <td className="td">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-100 text-[11px] font-bold uppercase text-navy-700">
                              {String(a.username ?? a.email ?? '?').slice(0, 2)}
                            </span>
                            <div className="min-w-0">
                              <p className="flex items-center gap-2 truncate font-semibold text-slate-900">
                                {a.username}
                                {isSelf && <span className="badge-info">You</span>}
                              </p>
                              {fullName(a) && (
                                <p className="truncate text-xs text-slate-400">{fullName(a)}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="td text-slate-600">{a.email}</td>
                        <td className="td">
                          <span className="badge-neutral">{roleLabel(a.role)}</span>
                        </td>
                        <td className="td">
                          {String(a.status) === '0' ? (
                            <span className="badge-danger">Disabled</span>
                          ) : (
                            <span className="badge-success">Active</span>
                          )}
                        </td>
                        <td className="td text-slate-500">
                          {a.last_login ? (
                            new Date(a.last_login).toLocaleString()
                          ) : (
                            <span className="text-slate-300">Never</span>
                          )}
                        </td>
                        {canManage && (
                          <td className="td">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                aria-label={`Edit ${a.username}`}
                                className="btn-quiet btn-icon"
                                onClick={() => {
                                  setForm({
                                    email: a.email ?? '',
                                    username: a.username ?? '',
                                    firstName: a.f_name ?? '',
                                    lastName: a.l_name ?? '',
                                    role: String(a.role ?? 'subadmin'),
                                    password: '',
                                    status: String(a.status ?? '1') === '0' ? '0' : '1',
                                  });
                                  setError(null);
                                  setEditing(a);
                                }}
                              >
                                <IconEdit className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Reset password for ${a.username}`}
                                className="btn-quiet btn-icon"
                                onClick={() => {
                                  setForm({ ...emptyForm, password: generatePassword() });
                                  setError(null);
                                  setResetting(a);
                                }}
                              >
                                <IconKey className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Delete ${a.username}`}
                                disabled={isSelf}
                                className="btn-quiet btn-icon text-slate-400 hover:bg-brand-50 hover:text-brand disabled:opacity-30"
                                onClick={() => {
                                  setError(null);
                                  setDeleting(a);
                                }}
                              >
                                <IconTrash className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="mt-4 space-y-3 md:hidden">
            {rows.map((a) => (
              <li key={a._id} className="card p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-[11px] font-bold uppercase text-navy-700">
                    {String(a.username ?? a.email ?? '?').slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{a.username}</p>
                    <p className="truncate text-xs text-slate-500">{a.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="badge-neutral">{roleLabel(a.role)}</span>
                      {String(a.status) === '0' ? (
                        <span className="badge-danger">Disabled</span>
                      ) : (
                        <span className="badge-success">Active</span>
                      )}
                      {String(a._id) === currentUserId && <span className="badge-info">You</span>}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Create */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New admin account"
        description="The password is shown here once — copy it before closing."
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setCreateOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={async () => {
                const ok = await send('/api/admins', 'POST', form, 'Account created');
                if (ok) setCreateOpen(false);
              }}
            >
              {busy && <Spinner className="h-4 w-4" />}
              Create account
            </button>
          </>
        }
      >
        <AccountFields form={form} setForm={setForm} error={error} showEmail showPassword />
      </Modal>

      {/* Edit */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Edit ${editing?.username ?? ''}`}
        description={
          String(editing?._id) === currentUserId
            ? 'This is your own account, so its role and status are locked.'
            : undefined
        }
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={async () => {
                const ok = await send(
                  `/api/admins/${editing._id}`,
                  'PUT',
                  {
                    username: form.username,
                    firstName: form.firstName,
                    lastName: form.lastName,
                    role: form.role,
                    status: form.status,
                  },
                  'Account updated',
                );
                if (ok) setEditing(null);
              }}
            >
              {busy && <Spinner className="h-4 w-4" />}
              Save changes
            </button>
          </>
        }
      >
        <AccountFields
          form={form}
          setForm={setForm}
          error={error}
          lockRole={String(editing?._id) === currentUserId}
          showStatus
        />
      </Modal>

      {/* Reset password */}
      <Modal
        open={Boolean(resetting)}
        onClose={() => setResetting(null)}
        title={`Reset password for ${resetting?.username ?? ''}`}
        description="The old password stops working immediately."
        size="sm"
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setResetting(null)} disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={async () => {
                const ok = await send(
                  `/api/admins/${resetting._id}`,
                  'PATCH',
                  { password: form.password },
                  'Password reset',
                );
                if (ok) setResetting(null);
              }}
            >
              {busy && <Spinner className="h-4 w-4" />}
              Reset password
            </button>
          </>
        }
      >
        <PasswordField
          value={form.password}
          onChange={(password) => setForm((f) => ({ ...f, password }))}
          error={error}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        busy={busy}
        title="Delete this account?"
        description={`${deleting?.username ?? ''} (${deleting?.email ?? ''}) will lose access immediately. This cannot be undone.`}
        confirmLabel="Delete account"
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          const ok = await send(`/api/admins/${deleting._id}`, 'DELETE', undefined, 'Account deleted');
          if (ok) setDeleting(null);
        }}
      />
    </>
  );
}

function AccountFields({
  form,
  setForm,
  error,
  showEmail = false,
  showPassword = false,
  showStatus = false,
  lockRole = false,
}: {
  form: FormState;
  setForm: (updater: (form: FormState) => FormState) => void;
  error: string | null;
  showEmail?: boolean;
  showPassword?: boolean;
  showStatus?: boolean;
  lockRole?: boolean;
}) {
  return (
    <div className="space-y-4">
      {showEmail && (
        <div>
          <label className="label" htmlFor="acc-email">
            Email<span className="ml-1 text-brand">*</span>
          </label>
          <input
            id="acc-email"
            type="email"
            className="input"
            value={form.email}
            onChange={(event) => setForm((f) => ({ ...f, email: event.target.value }))}
            placeholder="someone@realtyfocus.info"
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="acc-username">
            Username
          </label>
          <input
            id="acc-username"
            className="input"
            value={form.username}
            onChange={(event) => setForm((f) => ({ ...f, username: event.target.value }))}
          />
        </div>
        <div>
          <label className="label" htmlFor="acc-role">
            Role
          </label>
          <select
            id="acc-role"
            className="input-select"
            value={form.role}
            disabled={lockRole}
            onChange={(event) => setForm((f) => ({ ...f, role: event.target.value }))}
          >
            {ASSIGNABLE_ROLES.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="acc-first">
            First name
          </label>
          <input
            id="acc-first"
            className="input"
            value={form.firstName}
            onChange={(event) => setForm((f) => ({ ...f, firstName: event.target.value }))}
          />
        </div>
        <div>
          <label className="label" htmlFor="acc-last">
            Last name
          </label>
          <input
            id="acc-last"
            className="input"
            value={form.lastName}
            onChange={(event) => setForm((f) => ({ ...f, lastName: event.target.value }))}
          />
        </div>
      </div>

      {showStatus && (
        <div>
          <label className="label" htmlFor="acc-status">
            Status
          </label>
          <select
            id="acc-status"
            className="input-select"
            value={form.status}
            disabled={lockRole}
            onChange={(event) =>
              setForm((f) => ({ ...f, status: event.target.value === '0' ? '0' : '1' }))
            }
          >
            <option value="1">Active — can sign in</option>
            <option value="0">Disabled — sign-in blocked</option>
          </select>
        </div>
      )}

      {showPassword && (
        <PasswordField
          value={form.password}
          onChange={(password) => setForm((f) => ({ ...f, password }))}
          error={null}
        />
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-brand-100 bg-brand-50 px-3.5 py-2.5 text-sm text-brand-600">
          {error}
        </p>
      )}

      <p className="text-xs text-slate-400">
        Roles decide what a person can reach. A role this panel does not recognise keeps full access,
        so nothing that works today can break.
      </p>
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
}) {
  return (
    <div>
      <label className="label" htmlFor="acc-password">
        Password<span className="ml-1 text-brand">*</span>
      </label>
      <div className="flex gap-2">
        <input
          id="acc-password"
          className="input font-mono text-[13px]"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="button" className="btn-ghost shrink-0" onClick={() => onChange(generatePassword())}>
          Generate
        </button>
      </div>
      <p className="field-hint">
        At least 8 characters. It is hashed with bcrypt before it reaches the database — copy it now,
        it cannot be read back.
      </p>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
