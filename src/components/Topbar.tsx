'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useRef, useState } from 'react';
import SignOutButton from '@/components/SignOutButton';
import { crumbsFor } from '@/components/nav-items';
import { useNotifications } from '@/components/ui/Toast';
import {
  IconBell,
  IconChevronDown,
  IconChevronRight,
  IconMenu,
  IconPanelLeft,
  IconSearch,
  IconUsers,
} from '@/components/icons';
import type { SessionUser } from '@/lib/session';

type MenuName = 'bell' | 'user' | null;

function relativeTime(at: number) {
  const seconds = Math.round((Date.now() - at) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Date(at).toLocaleDateString();
}

const DOT: Record<string, string> = {
  success: 'bg-emerald-500',
  error: 'bg-brand',
  warning: 'bg-amber-500',
  info: 'bg-navy-400',
};

export default function Topbar({
  user,
  collapsed,
  onToggleCollapsed,
  onOpenMobile,
  mobileOpen,
}: {
  user: SessionUser;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  onOpenMobile: () => void;
}) {
  const pathname = usePathname();
  const crumbs = crumbsFor(pathname);
  const { notifications, unread, markAllRead, clearNotifications } = useNotifications();

  const [menu, setMenu] = useState<MenuName>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onPointerDown = (event: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(event.target as Node)) setMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenu(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menu]);

  useEffect(() => setMenu(null), [pathname]);

  const initials = (user.username || user.email || '?').trim().slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <div ref={barRef} className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          aria-controls="main-sidebar"
          className="btn-quiet btn-icon shrink-0 lg:hidden"
        >
          <IconMenu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="btn-quiet btn-icon hidden lg:inline-flex"
        >
          <IconPanelLeft className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center gap-1.5 text-sm">
            {crumbs.map((crumb, index) => (
              <Fragment key={`${crumb.label}-${index}`}>
                {index > 0 && <IconChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
                <li className="min-w-0">
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="block truncate text-slate-500 transition-colors hover:text-slate-900"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="block truncate font-semibold text-slate-900">{crumb.label}</span>
                  )}
                </li>
              </Fragment>
            ))}
          </ol>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Global search — goes straight to the projects list, which is where
              the searchable data lives. */}
          <form action="/microsites" method="get" className="relative hidden md:block">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              name="q"
              placeholder="Search projects…"
              aria-label="Search projects"
              className="input h-9 w-56 pl-9 lg:w-72"
            />
          </form>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setMenu(menu === 'bell' ? null : 'bell');
                markAllRead();
              }}
              aria-label={unread > 0 ? `Notifications, ${unread} new` : 'Notifications'}
              aria-expanded={menu === 'bell'}
              className="btn-quiet btn-icon relative"
            >
              <IconBell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-brand/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
                </span>
              )}
            </button>

            {menu === 'bell' && (
              <div className="fixed inset-x-4 top-16 z-40 mt-2 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:w-[320px] origin-top-right animate-scale-in rounded-xl border border-slate-200 bg-white shadow-pop">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">Activity</p>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={clearNotifications}
                      className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-500">
                    Nothing yet. Saves, errors and session messages show up here.
                  </p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto py-1">
                    {notifications.map((note) => (
                      <li key={note.id} className="flex gap-3 px-4 py-2.5 hover:bg-slate-50">
                        <span
                          aria-hidden="true"
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[note.kind] ?? 'bg-slate-300'}`}
                        />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-slate-900">{note.title}</p>
                          {note.description && (
                            <p className="truncate text-xs text-slate-500">{note.description}</p>
                          )}
                          <p className="mt-0.5 text-[11px] text-slate-400">{relativeTime(note.at)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenu(menu === 'user' ? null : 'user')}
              aria-expanded={menu === 'user'}
              aria-label="Account menu"
              className="flex h-9 items-center gap-2 rounded-lg pl-1 pr-1.5 transition duration-200 ease-smooth hover:bg-slate-100"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-[11px] font-bold text-white">
                {initials}
              </span>
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-700 sm:block">
                {user.username || user.email}
              </span>
              <IconChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                  menu === 'user' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {menu === 'user' && (
              <div className="absolute right-0 top-full z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] origin-top-right animate-scale-in rounded-xl border border-slate-200 bg-white p-1.5 shadow-pop">
                <div className="px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {user.username || user.email}
                  </p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                  <span className="badge-info mt-2 capitalize">{user.role}</span>
                </div>

                <div className="my-1 border-t border-slate-100" />

                <Link
                  href="/admins"
                  className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <IconUsers className="h-4 w-4 text-slate-400" />
                  Admin users
                </Link>

                <div className="my-1 border-t border-slate-100" />

                <div className="p-1">
                  <SignOutButton className="btn-ghost btn-sm w-full justify-start" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
