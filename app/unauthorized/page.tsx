'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnauthorizedPage() {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
            <svg
              className="h-6 w-6 text-orange-600 dark:text-orange-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Access Denied
          </CardTitle>
          <CardDescription className="text-base">
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {session?.user && (
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                Signed in as:
              </p>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {session.user.email}
              </p>
              {session.user.roles && session.user.roles.length > 0 && (
                <>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-3 mb-2">
                    Your roles:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {session.user.roles.map((role: string) => (
                      <span
                        key={role}
                        className="inline-flex items-center rounded-full bg-zinc-200 dark:bg-zinc-700 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-200"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10 p-4">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              This page requires specific permissions that your account doesn't have.
              Please contact an administrator if you believe you should have access.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/">Go to Home</Link>
            </Button>
            {session && (
              <Button
                onClick={() => signOut({ callbackUrl: '/' })}
                variant="outline"
                className="w-full"
              >
                Sign Out
              </Button>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Need help?{' '}
              <Link href="/support" className="font-medium text-primary hover:underline">
                Contact Support
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
