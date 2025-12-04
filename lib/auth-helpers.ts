import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import type { KeycloakSession } from '@/lib/types/auth';

/**
 * Get the current session on the server side
 * Use this in Server Components and Server Actions
 */
export async function getSession() {
  return await getServerSession(authOptions) as KeycloakSession | null;
}

/**
 * Require authentication for a page
 * Redirects to sign-in if not authenticated
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    redirect('/auth/signin');
  }

  return session;
}

/**
 * Get the current user
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Get the Keycloak access token for making authenticated API calls
 * Returns null if not authenticated
 */
export async function getAccessToken() {
  const session = await getSession();
  return session?.accessToken || null;
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: string) {
  const session = await getSession();
  return session?.user.roles?.includes(role) || false;
}

/**
 * Check if the current user has any of the specified roles
 */
export async function hasAnyRole(roles: string[]) {
  const session = await getSession();
  const userRoles = session?.user.roles || [];
  return roles.some(role => userRoles.includes(role));
}
