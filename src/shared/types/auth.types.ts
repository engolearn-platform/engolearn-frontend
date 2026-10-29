export type AuthUserRole = "USER" | "CONTENT_MANAGER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  role: AuthUserRole;
}

export interface AuthMeResponse {
  data: AuthUser;
  timestamp: string;
}
