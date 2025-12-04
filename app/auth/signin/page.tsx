'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('keycloak', { callbackUrl });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Welcome to Fitness Devil
          </CardTitle>
          <CardDescription className="text-base">
            Sign in to access your fitness dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
              {error === 'OAuthSignin' && 'Error occurred during sign in. Please try again.'}
              {error === 'OAuthCallback' && 'Error occurred during callback. Please try again.'}
              {error === 'OAuthCreateAccount' && 'Could not create account. Please try again.'}
              {error === 'EmailCreateAccount' && 'Could not create account. Please try again.'}
              {error === 'Callback' && 'Error occurred during callback. Please try again.'}
              {error === 'OAuthAccountNotLinked' && 'Account already exists with different provider.'}
              {error === 'SessionRequired' && 'Please sign in to access this page.'}
              {!['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'EmailCreateAccount', 'Callback', 'OAuthAccountNotLinked', 'SessionRequired'].includes(error) &&
                'An error occurred. Please try again.'}
            </div>
          )}

          <Button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Redirecting...</span>
              </div>
            ) : (
              'Sign in with Keycloak'
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-zinc-950 px-2 text-muted-foreground">
                Secure authentication
              </span>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Don't have an account?{' '}
              <a
                href="/auth/signup"
                className="font-medium text-primary hover:underline"
              >
                Create an account
              </a>
            </p>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
