'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navigation } from '@/components/navigation';

type NavigationShellProps = {
  children: React.ReactNode;
};

export function NavigationShell({ children }: NavigationShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const hideNav =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/unauthorized') ||
    pathname.startsWith('/welcome');

  const showNav = !hideNav;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(248,113,113,0.08),rgba(3,7,18,0.9)_45%),radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.12),transparent_40%)]">
      {showNav ? <Navigation /> : null}
      <main
        className={
          showNav
            ? 'min-h-screen px-4 pb-10 pt-20 md:pl-72 md:pt-10'
            : 'min-h-screen px-4 pb-10 pt-10'
        }
      >
        {children}
      </main>
    </div>
  );
}
