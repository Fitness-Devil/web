import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function SignUpPage() {
  const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER || 'http://localhost:8543/realms/fitnessdevil';
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'fitnessdevil-frontend';
  const baseUrl = await (async () => {
    const envUrl = process.env.NEXTAUTH_URL;
    if (envUrl) {
      return envUrl.replace(/\/$/, '');
    }

    const requestHeaders = await headers();
    const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host');
    const proto = requestHeaders.get('x-forwarded-proto') || 'http';
    return host ? `${proto}://${host}` : 'http://localhost:3000';
  })();
  const redirectUri = `${baseUrl}/api/auth/callback/keycloak`;
  const registerUrl = `${keycloakUrl}/protocol/openid-connect/registrations?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid+user-info`;

  redirect(registerUrl);
}
