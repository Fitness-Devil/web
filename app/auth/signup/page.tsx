'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignUpPage() {
  useEffect(() => {
    // Automatically redirect to Keycloak registration
    const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER || 'http://localhost:8543/realms/fitnessdevil';
    const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'fitnessdevil-frontend';
    const redirectUri = `${window.location.origin}/api/auth/callback/keycloak`;

    const registerUrl = `${keycloakUrl}/protocol/openid-connect/registrations?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid+user-info`;

    window.location.href = registerUrl;
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Redirecting to Sign Up
          </CardTitle>
          <CardDescription className="text-base">
            Taking you to the registration page...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
        </CardContent>
      </Card>
    </div>
  );
}
