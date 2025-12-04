'use client';

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

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="h-9 w-24 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
    );
  }

  if (session?.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {session.user.name?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="hidden sm:inline">{session.user.name || session.user.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{session.user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          {session.user.roles && session.user.roles.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs text-muted-foreground">Roles</p>
                  <div className="flex flex-wrap gap-1">
                    {session.user.roles.map((role: string) => (
                      <span
                        key={role}
                        className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </DropdownMenuLabel>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/dashboard">Dashboard</a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/profile">Profile</a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/settings">Settings</a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-red-600 dark:text-red-400"
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={() => signIn('keycloak')}>
      Sign In
    </Button>
  );
}
