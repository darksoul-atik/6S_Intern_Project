export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface SignupResponseData {
  id?: string;
  user?: AuthUser;
}

export interface LoginResponseData {
  accessToken?: string;
  user: AuthUser;
}
