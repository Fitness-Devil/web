import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      preferredUsername?: string;
      roles?: string[];
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    preferredUsername?: string;
    roles?: string[];
  }

  interface Profile {
    sub?: string;
    name?: string;
    email?: string;
    preferred_username?: string;
    realm_access?: {
      roles?: string[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    email?: string;
    name?: string | null;
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
    preferredUsername?: string;
    roles?: string[];
  }
}
