import NextAuth, { NextAuthOptions } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
      checks: ['pkce', 'state'],
      authorization: {
        params: {
          scope: 'openid user-info',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and refresh_token to the token
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        token.expiresAt = account.expires_at;
      }

      // Add Keycloak user info to token
      if (profile) {
        token.id = profile.sub;
        token.email = profile.email;
        token.name = profile.name;
        token.preferredUsername = profile.preferred_username;
        token.roles = profile.realm_access?.roles || [];
      }

      return token;
    },
    async session({ session, token }) {
      // Pass token info to the session
      if (token && session.user) {
        session.user.id = token.id || '';
        session.user.email = token.email || null;
        session.user.name = token.name || null;
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
        session.idToken = token.idToken;
        session.expiresAt = token.expiresAt;
        session.user.preferredUsername = token.preferredUsername;
        session.user.roles = token.roles;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
