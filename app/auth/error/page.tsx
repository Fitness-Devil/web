'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, { title: string; description: string }> = {
    Configuration: {
      title: 'Server Configuration Error',
      description: 'There is a problem with the server configuration. Please contact support.',
    },
    AccessDenied: {
      title: 'Access Denied',
      description: 'You do not have permission to sign in. Please contact an administrator.',
    },
    Verification: {
      title: 'Verification Failed',
      description: 'The verification token has expired or has already been used.',
    },
    Default: {
      title: 'Authentication Error',
      description: 'An error occurred during authentication. Please try again.',
    },
  };

  const errorInfo = errorMessages[error || 'Default'] || errorMessages.Default;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-base">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 text-xs font-mono text-zinc-600 dark:text-zinc-400">
              Error code: {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/auth/signin">Try Again</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Go Home</Link>
            </Button>
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
