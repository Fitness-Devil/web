'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Workouts', href: '/dashboard/workouts' },
    { name: 'Exercise Library', href: '/dashboard/exercises' },
    { name: 'Nutrition', href: '/dashboard/nutrition' },
    { name: 'Recipes', href: '/dashboard/recipes' },
    { name: 'Meal Planner', href: '/dashboard/meal-planner' },
    { name: 'Videos', href: '/dashboard/videos' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 md:inset-y-0 md:right-auto md:w-64 md:border-r md:border-white/10 md:bg-sidebar/80 md:backdrop-blur">
      <div className="flex h-16 items-center justify-between border-b border-white/10 bg-sidebar/90 px-4 backdrop-blur md:hidden">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 4.5c2.2 0 4.1.9 5.4 2.4l1.6-1.6-.7 4.2-4.2-.7 1.4-1.4C14.7 6.7 13.4 6.2 12 6.2c-2.1 0-3.9 1.2-4.7 2.9H5.5c.9-2.6 3.4-4.6 6.5-4.6Zm0 15c-2.2 0-4.1-.9-5.4-2.4l-1.6 1.6.7-4.2 4.2.7-1.4 1.4c.8.7 2.1 1.2 3.5 1.2 2.1 0 3.9-1.2 4.7-2.9h1.8c-.9 2.6-3.4 4.6-6.5 4.6Z"
              />
            </svg>
          </span>
          Fitness Devil
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="border-white/10 bg-white/5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Navigation</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {navItems.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href} className={isActive(item.href) ? 'text-primary' : ''}>
                  {item.name}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {session ? (
              <DropdownMenuItem
                onClick={() => signOut()}
                className="text-destructive focus:text-destructive"
              >
                Sign Out
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => signIn('keycloak')}>
                Sign In
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="hidden h-full flex-col px-4 py-6 md:flex">
        <Link
          href="/"
          className="flex items-center gap-3 text-lg font-semibold tracking-wide text-white"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 4.5c2.2 0 4.1.9 5.4 2.4l1.6-1.6-.7 4.2-4.2-.7 1.4-1.4C14.7 6.7 13.4 6.2 12 6.2c-2.1 0-3.9 1.2-4.7 2.9H5.5c.9-2.6 3.4-4.6 6.5-4.6Zm0 15c-2.2 0-4.1-.9-5.4-2.4l-1.6 1.6.7-4.2 4.2.7-1.4 1.4c.8.7 2.1 1.2 3.5 1.2 2.1 0 3.9-1.2 4.7-2.9h1.8c-.9 2.6-3.4 4.6-6.5 4.6Z"
              />
            </svg>
          </span>
          Fitness Devil
        </Link>

        <div className="mt-8 flex-1">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">Navigation</p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(248,113,113,0.4)]'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full transition ${
                      active ? 'bg-primary shadow-[0_0_12px_rgba(248,113,113,0.9)]' : 'bg-zinc-600'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          {status === 'loading' ? (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-primary"></div>
              <p className="text-sm text-zinc-400">Loading session...</p>
            </div>
          ) : session ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Signed In</p>
                <p className="truncate text-sm font-medium text-zinc-200">
                  {session.user?.email || 'Account'}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">Sign in to access your dashboard.</p>
              <Button onClick={() => signIn('keycloak')} className="w-full">
                Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
