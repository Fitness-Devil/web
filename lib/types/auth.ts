export interface User {
  id: string;
  email: string;
  name?: string;
  preferredUsername?: string;
  roles?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface KeycloakSession {
  user: User;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}
