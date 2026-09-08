'use client';

// Sidebar navigation item. Active detection is unchanged from the original
// implementation, so every existing route keeps highlighting the way it did.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isActive, type NavItem } from '@/components/nav-items';

export default function NavLink({
  item,
  collapsed = false,
  onNavigate,
}: {
  item: NavItem;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActive(item.href, pathname);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      aria-label={item.label}
      title={collapsed ? item.label : undefined}
      className={`group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition duration-200 ease-smooth
        ${
          active
            ? 'bg-navy-50 font-semibold text-navy-800'
            : 'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-navy"
        />
      )}

      <Icon
        className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
          active ? 'text-navy' : 'text-slate-400 group-hover:text-slate-600'
        }`}
      />

      <span className={`min-w-0 flex-1 truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>

      {collapsed && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 scale-95
                     whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-white
                     opacity-0 shadow-pop transition duration-200 ease-smooth
                     group-hover:scale-100 group-hover:opacity-100 lg:block"
        >
          {item.label}
        </span>
      )}
    </Link>
  );
}
