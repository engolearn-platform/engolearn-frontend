import * as React from "react";
import { httpService } from "@shared/services";
import type { AuthUser, AuthMeResponse } from "@shared/types/auth.types";

interface Credentials { email: string; password: string }
interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  identityGeneration: number;
  isUser: () => boolean;
  isContentManager: () => boolean;
  isAdmin: () => boolean;
  login: (credentials: Credentials) => Promise<AuthUser>;
  register: (credentials: Credentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refetch: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

function parseUser(value: unknown): AuthUser {
  if (!value || typeof value !== "object") throw new Error("Invalid authentication response");
  const user = value as Partial<AuthUser>;
  if (typeof user.id !== "string" || !user.id.trim() || typeof user.email !== "string" || !["USER", "CONTENT_MANAGER", "ADMIN"].includes(user.role ?? "")) {
    throw new Error("Invalid authentication response");
  }
  return user as AuthUser;
}

function responseUser(response: unknown): AuthUser {
  if (!response || typeof response !== "object" || !("data" in response)) throw new Error("Invalid authentication response");
  return parseUser((response as AuthMeResponse).data);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [identityGeneration, setIdentityGeneration] = React.useState(0);
  const requestGeneration = React.useRef(0);
  const controllerRef = React.useRef<AbortController | null>(null);

  const beginIdentityChange = React.useCallback(() => {
    const generation = ++requestGeneration.current;
    controllerRef.current?.abort();
    controllerRef.current = null;
    setIdentityGeneration(generation);
    return generation;
  }, []);

  const fetchMe = React.useCallback(async () => {
    const generation = beginIdentityChange();
    const controller = new AbortController();
    controllerRef.current = controller;
    setUser(null);
    setIsLoading(true);
    setError(null);
    try {
      const response = await httpService.get<AuthMeResponse>("/api/v1/auth/me", { signal: controller.signal });
      if (controller.signal.aborted || generation !== requestGeneration.current) return;
      setUser(responseUser(response));
    } catch (err) {
      if (controller.signal.aborted || generation !== requestGeneration.current) return;
      const httpErr = err as Error & { status?: number };
      if (httpErr.status === 401) { setUser(null); setError(null); }
      else { setUser(null); setError(err instanceof Error ? err.message : "Could not check your session"); }
    } finally {
      if (!controller.signal.aborted && generation === requestGeneration.current) setIsLoading(false);
    }
  }, [beginIdentityChange]);

  React.useEffect(() => {
    void fetchMe();
    return () => { controllerRef.current?.abort(); };
  }, [fetchMe]);

  const authenticate = React.useCallback(async (path: "login" | "register", credentials: Credentials) => {
    const generation = beginIdentityChange();
    setIsLoading(true);
    setError(null);
    try {
      const result = await httpService.post<unknown>(`/api/v1/auth/${path}`, credentials, { skipAuthRefresh: true });
      const nextUser = responseUser(result);
      if (generation === requestGeneration.current) {
        setUser(nextUser);
        setError(null);
        setIsLoading(false);
      }
      return nextUser;
    } catch (err) {
      if (generation === requestGeneration.current) {
        setError(err instanceof Error ? err.message : "Authentication failed");
        setIsLoading(false);
      }
      throw err;
    }
  }, [beginIdentityChange]);

  const login = React.useCallback((credentials: Credentials) => authenticate("login", credentials), [authenticate]);
  const register = React.useCallback((credentials: Credentials) => authenticate("register", credentials), [authenticate]);

  const logout = React.useCallback(async () => {
    const generation = beginIdentityChange();
    setIsLoading(true);
    setError(null);
    let logoutError: unknown;
    try {
      await httpService.post<unknown>("/api/v1/auth/logout", {}, { skipAuthRefresh: true });
    } catch (err) { logoutError = err; }
    if (generation === requestGeneration.current) {
      setUser(null);
      setIsLoading(false);
      if (logoutError) setError(logoutError instanceof Error ? `Signed out locally; server sign-out could not be confirmed: ${logoutError.message}` : "Signed out locally; server sign-out could not be confirmed");
    }
  }, [beginIdentityChange]);

  const isUser = React.useCallback(() => user?.role === "USER", [user]);
  const isContentManager = React.useCallback(() => user?.role === "CONTENT_MANAGER", [user]);
  const isAdmin = React.useCallback(() => user?.role === "ADMIN", [user]);
  const value: AuthContextType = {
    user, isAuthenticated: user !== null, isLoading, error, identityGeneration,
    isUser, isContentManager, isAdmin,
    login, register, logout, refetch: fetchMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
