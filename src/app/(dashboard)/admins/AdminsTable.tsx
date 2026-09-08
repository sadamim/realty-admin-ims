'use client';

// Search and sorting run entirely in the browser over the rows the server
// already sent. No new API, no new query params, no schema change.
import { useMemo, useState } from 'react';
import EmptyState from '@/components/ui/EmptyState';
import { IconChevronDown, IconSearch, IconUsers } from '@/components/icons';

type SortKey = 'username' | 'email' | 'role' | 'status' | 'last_login';

const COLUMNS: Array<{ key: SortKey; label: string; align?: string }> = [
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

export default function AdminsTable({ admins }: { admins: any[] }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'username',
    dir: 'asc',
  });

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
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    );

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
        <p className="text-sm text-slate-500">
          <span className="font-medium tabular-nums text-slate-700">{rows.length}</span> of{' '}
          <span className="tabular-nums">{admins.length}</span> accounts
        </p>
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
              <table className="w-full min-w-[760px] border-collapse">
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
                                active
                                  ? sort.dir === 'asc'
                                    ? 'rotate-180 text-navy'
                                    : 'text-navy'
                                  : 'opacity-0'
                              }`}
                            />
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a._id} className="row">
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-100 text-[11px] font-bold uppercase text-navy-700">
                            {String(a.username ?? a.email ?? '?').slice(0, 2)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{a.username}</p>
                            {fullName(a) && (
                              <p className="truncate text-xs text-slate-400">{fullName(a)}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="td text-slate-600">{a.email}</td>
                      <td className="td">
                        <span className="badge-neutral capitalize">{a.role}</span>
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
                    </tr>
                  ))}
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
                      <span className="badge-neutral capitalize">{a.role}</span>
                      {String(a.status) === '0' ? (
                        <span className="badge-danger">Disabled</span>
                      ) : (
                        <span className="badge-success">Active</span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
