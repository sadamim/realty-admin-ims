'use client';

import Link from 'next/link';
import NavLink from '@/components/NavLink';
import SignOutButton from '@/components/SignOutButton';
import { NAV_ITEMS } from '@/components/nav-items';
import { IconClose, IconPanelLeft } from '@/components/icons';
import type { SessionUser } from '@/lib/session';

export default function Sidebar({
  user,
  collapsed,
  mobileOpen,
  onToggleCollapsed,
  onCloseMobile,
}: {
  user: SessionUser;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
}) {
  const initials = (user.username || user.email || '?').trim().slice(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile scrim */}
      <div
        aria-hidden="true"
        onClick={onCloseMobile}
        className={`fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300 ease-smooth lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-slate-200 bg-white
                    transition-[transform,width] duration-300 ease-smooth lg:translate-x-0
                    ${collapsed ? 'lg:w-[76px]' : 'lg:w-[260px]'}
                    ${mobileOpen ? 'translate-x-0 shadow-pop' : '-translate-x-full'}`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-4">
          <Link
            href="/"
            onClick={onCloseMobile}
            className="flex min-w-0 items-center gap-3"
            aria-label="Realty Focus Admin — dashboard"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy text-[13px] font-bold tracking-tight text-white">
              RF
            </span>
            <span className={`min-w-0 leading-tight ${collapsed ? 'lg:hidden' : ''}`}>
              <span className="block truncate text-[13px] font-semibold text-slate-900">
                Realty Focus
              </span>
              <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                Admin
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="btn-quiet btn-icon ml-auto lg:hidden"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3" aria-label="Main">
          <p
            className={`px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 ${
              collapsed ? 'lg:hidden' : ''
            }`}
          >
            Manage
          </p>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onCloseMobile} />
          ))}
        </nav>

        {/* Account */}
        <div className="border-t border-slate-100 p-3">
          <div
            className={`flex items-center gap-3 rounded-xl px-2 py-2 ${collapsed ? 'lg:justify-center' : ''}`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-700">
              {initials}
            </span>
            <span className={`min-w-0 flex-1 leading-tight ${collapsed ? 'lg:hidden' : ''}`}>
              <span className="block truncate text-[13px] font-semibold text-slate-900">
                {user.username || user.email}
              </span>
              <span className="block truncate text-[11px] capitalize text-slate-400">{user.role}</span>
            </span>
          </div>

          <div className={`mt-2 ${collapsed ? 'lg:hidden' : ''}`}>
            <SignOutButton className="btn-ghost btn-sm w-full justify-start" />
          </div>

          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="btn-quiet btn-sm mt-2 hidden w-full justify-start gap-2 lg:inline-flex"
          >
            <IconPanelLeft className="h-4 w-4 shrink-0" />
            <span className={collapsed ? 'lg:hidden' : ''}>Collapse</span>
          </button>
        </div>
      </aside>
    </>
  );
}
