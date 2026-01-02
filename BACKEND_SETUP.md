# Backend Integration Setup

This Next.js frontend is now connected to the Quarkus GraphQL backend located at `~/Projekti/Java/fitness-devil/fitnessdevil-core` and uses **Keycloak** for authentication.

## Prerequisites

1. Make sure the Quarkus backend is running on `http://localhost:8080`
2. PostgreSQL database should be running and accessible
3. **Keycloak server** should be running (typically on `http://localhost:8180`)
4. Environment variables should be configured

## Keycloak Setup

### 1. Install and Start Keycloak

Download Keycloak from [https://www.keycloak.org/downloads](https://www.keycloak.org/downloads)

Start Keycloak in development mode:
```bash
cd keycloak-<version>
bin/kc.sh start-dev
# or on Windows:
# bin\kc.bat start-dev
```

Access Keycloak Admin Console at `http://localhost:8180/admin`

### 2. Create a Realm

1. Login to Keycloak Admin Console
2. Create a new realm (e.g., `fitness-devil`)
3. Note the realm name for your configuration

### 3. Create a Client

1. Go to **Clients** → **Create client**
2. Set **Client ID**: `fitness-devil-web`
3. Set **Client type**: OpenID Connect
4. Enable **Client authentication**
5. Set **Valid redirect URIs**: `http://localhost:3000/api/auth/callback/keycloak`
6. Set **Web origins**: `http://localhost:3000`
7. Save and note the **Client Secret** from the **Credentials** tab

### 4. Configure Roles (Optional)

Create roles for your application:
- `user` - Standard user role
- `admin` - Admin role
- `trainer` - Trainer role

## Configuration Files

### 1. Environment Variables (`.env.local`)
```env
# Backend API Configuration
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8080/graphql

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-change-in-production

# Keycloak Configuration
KEYCLOAK_CLIENT_ID=fitness-devil-web
KEYCLOAK_CLIENT_SECRET=your-keycloak-client-secret
KEYCLOAK_ISSUER=http://localhost:8180/realms/fitness-devil
```

**Important:** Generate secure secrets for production:
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

### 2. Apollo Client (`lib/apollo-client.ts`)
- Configured to connect to Quarkus GraphQL endpoint
- Automatically adds Keycloak access token from NextAuth session to requests
- Includes error handling for GraphQL and network errors

### 3. NextAuth with Keycloak
`app/api/auth/[...nextauth]/route.ts` is configured to:
- Use Keycloak as the OAuth provider
- Store Keycloak access token, refresh token, and ID token in session
- Extract user roles from Keycloak realm_access
- Pass tokens to all subsequent API requests

### 4. Auth Helper Functions (`lib/auth-helpers.ts`)
Helper functions for server-side auth:
- `getSession()` - Get current Keycloak session
- `requireAuth()` - Require authentication for pages
- `getCurrentUser()` - Get current user info
- `getAccessToken()` - Get Keycloak access token for API calls
- `hasRole(role)` - Check if user has a specific role
- `hasAnyRole(roles)` - Check if user has any of the specified roles

## Starting the Application

### 1. Start the Quarkus Backend

```bash
cd ~/Projekti/Java/fitness-devil/fitnessdevil-core
./mvnw quarkus:dev
```

The backend will start on `http://localhost:8080`

### 2. Start the Next.js Frontend

```bash
cd ~/Projekti/Next/fitness-devil-web
npm run dev
```

The frontend will start on `http://localhost:3000`

### 3. (Optional) Generate GraphQL Types

To generate TypeScript types from your GraphQL schema:

```bash
npm run codegen
```

Or watch for changes:

```bash
npm run codegen:watch
```

## Authentication Flow with Keycloak

1. **Registration:**
   - User clicks "Sign In" and is redirected to Keycloak
   - User can register a new account in Keycloak (if registration is enabled in Keycloak settings)
   - Alternatively, admins can create users in Keycloak Admin Console

2. **Login:**
   - User clicks "Sign In" in the application
   - User is redirected to Keycloak login page
   - User enters credentials in Keycloak
   - Keycloak validates credentials and redirects back to application
   - NextAuth receives OAuth tokens (access token, refresh token, ID token)
   - Tokens and user info stored in NextAuth session
   - User roles extracted from Keycloak token

3. **Authenticated Requests:**
   - Apollo Client gets Keycloak access token from NextAuth session
   - Adds `Authorization: Bearer <keycloak-access-token>` header to requests
   - Quarkus backend validates Keycloak JWT token
   - Quarkus processes request based on user roles and permissions

4. **Role-Based Access Control:**
   - Use `hasRole()` or `hasAnyRole()` helpers in server components
   - Roles are automatically synced from Keycloak to the session
   - Backend can validate roles from the Keycloak token

## Using Apollo Client in Components

```tsx
'use client';

import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    getCurrentUser {
      id
      name
      email
    }
  }
`;

export function UserProfile() {
  const { data, loading, error } = useQuery(GET_CURRENT_USER);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Welcome, {data.getCurrentUser.name}!</div>;
}
```

## Using Authentication in Your App

### Client-Side Authentication (React Components)

```tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export function LoginButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (session) {
    return (
      <div>
        <p>Welcome, {session.user?.name}!</p>
        <p>Roles: {session.user?.roles?.join(', ')}</p>
        <button onClick={() => signOut()}>Sign Out</button>
      </div>
    );
  }

  return <button onClick={() => signIn('keycloak')}>Sign In with Keycloak</button>;
}
```

### Server-Side Authentication (Server Components)

```tsx
import { requireAuth, hasRole } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await requireAuth(); // Redirects to sign-in if not authenticated

  // Check for specific role
  const isAdmin = await hasRole('admin');

  if (!isAdmin) {
    redirect('/unauthorized');
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {session.user.name}!</p>
    </div>
  );
}
```

### Making Authenticated GraphQL Requests

The Apollo Client automatically includes the Keycloak access token in all requests:

```tsx
'use client';

import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_USER_DATA = gql`
  query GetUserData {
    getCurrentUser {
      id
      name
      email
    }
  }
`;

export function UserProfile() {
  // Apollo Client automatically adds the Keycloak token
  const { data, loading, error } = useQuery(GET_USER_DATA);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Welcome, {data.getCurrentUser.name}!</div>;
}
```

## Wrap Your App with Providers

To use Apollo Client and authentication in your components, wrap your app with the necessary providers:

```tsx
// app/layout.tsx
import { ApolloProviderWrapper } from '@/components/providers/apollo-provider';
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          <ApolloProviderWrapper>
            {children}
          </ApolloProviderWrapper>
        </SessionProvider>
      </body>
    </html>
  );
}
```

## Troubleshooting

### Keycloak Connection Issues

1. **Keycloak not accessible:**
   - Verify Keycloak is running: `curl http://localhost:8180`
   - Check the Keycloak issuer URL in `.env.local`
   - Ensure the realm name is correct

2. **Invalid redirect URI:**
   - Verify `http://localhost:3000/api/auth/callback/keycloak` is in Keycloak client's valid redirect URIs
   - Check that Web Origins includes `http://localhost:3000`

3. **Client authentication failed:**
   - Verify `KEYCLOAK_CLIENT_ID` matches the client ID in Keycloak
   - Verify `KEYCLOAK_CLIENT_SECRET` matches the client secret in Keycloak (Credentials tab)
   - Ensure Client authentication is enabled in Keycloak client settings

### Backend Connection Issues

1. Verify Quarkus is running: `curl http://localhost:8080/graphql`
2. Check GraphQL endpoint: `curl -X POST http://localhost:8080/graphql -H "Content-Type: application/json" -d '{"query": "query { __typename }"}'`
3. Check CORS settings in Quarkus if getting CORS errors

### Quarkus + Keycloak Integration

1. **Configure Quarkus to validate Keycloak tokens:**
   Add to `application.properties`:
   ```properties
   quarkus.oidc.auth-server-url=http://localhost:8180/realms/fitness-devil
   quarkus.oidc.client-id=fitness-devil-backend
   quarkus.oidc.credentials.secret=your-backend-client-secret
   ```

2. **Token validation errors:**
   - Ensure Quarkus OIDC extension is installed
   - Verify the auth-server-url points to your Keycloak realm
   - Check that the Keycloak public key is accessible

### Session Issues

1. Ensure NEXTAUTH_SECRET is set in `.env.local`
2. Clear cookies if switching between authentication methods
3. Check browser console for authentication errors

### GraphQL Schema Sync

If you update the backend schema:

1. Restart Quarkus backend
2. Run `npm run codegen` to regenerate types
3. Update GraphQL operations in `graphql/` directory as needed

## Next Steps

1. **Set up Keycloak:**
   - Install and start Keycloak server
   - Create a realm for your application
   - Create a client with proper configuration
   - Create users or enable user registration

2. **Configure environment variables:**
   - Generate secure `NEXTAUTH_SECRET`: `openssl rand -base64 32`
   - Set Keycloak client credentials from Keycloak Admin Console
   - Update `KEYCLOAK_ISSUER` with your realm URL

3. **Configure Quarkus backend:**
   - Add Quarkus OIDC extension
   - Configure Keycloak integration in `application.properties`
   - Update GraphQL resolvers to validate Keycloak tokens

4. **Test authentication flow:**
   - Test login with Keycloak
   - Verify tokens are passed to backend
   - Test role-based access control

5. **Customize as needed:**
   - Add more GraphQL queries/mutations
   - Configure additional Keycloak features (social login, 2FA, etc.)
   - Set up token refresh handling if needed
