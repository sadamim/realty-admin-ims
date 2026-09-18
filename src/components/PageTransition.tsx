'use client';

// Re-keys on route change so each page fades and lifts into place.
// 340ms, and it never blocks interaction — the content is already there.
import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="min-w-0 max-w-full animate-fade-up">
      {children}
    </div>
  );
}
