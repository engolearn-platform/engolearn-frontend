import * as React from "react";
import { httpService, DEV_USER_STORAGE_KEY } from "@shared/services";
import type { AuthUser, AuthMeResponse } from "@shared/types/auth.types";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  identityGeneration: number;
  isUser: () => boolean;
  isContentManager: () => boolean;
  isAdmin: () => boolean;
  devUserKey: string | null;
  setDevUserKey: (key: string) => void;
  refetch: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [identityGeneration, setIdentityGeneration] = React.useState(0);
  const requestGeneration = React.useRef(0);
  const controllerRef = React.useRef<AbortController | null>(null);
  const [devUserKey, setDevUserKeyState] = React.useState<string | null>(() => {
    if (!import.meta.env.DEV) {
      return null;
    }
    try {
      return localStorage.getItem(DEV_USER_STORAGE_KEY) ?? "dev-user";
    } catch {
      return "dev-user";
    }
  });

  const fetchMe = React.useCallback(async () => {
    const generation = ++requestGeneration.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIdentityGeneration(generation);
    setUser(null);
    setIsLoading(true);
    setError(null);
    try {
      const data = await httpService.get<AuthMeResponse>("/api/v1/auth/me", { signal: controller.signal });
      if (controller.signal.aborted || generation !== requestGeneration.current) return;
      if (!data?.data || typeof data.data.id !== "string" || !data.data.id.trim() || typeof data.data.email !== "string" || !["USER", "CONTENT_MANAGER", "ADMIN"].includes(data.data.role)) {
        throw new Error("Invalid authentication response");
      }
      setUser(data.data);
    } catch (err) {
      if (controller.signal.aborted || generation !== requestGeneration.current) return;
      const httpErr = err as Error & { status?: number };
      if (httpErr.status === 401) {
        setUser(null);
        setError(null);
      } else {
        setUser(null);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      if (!controller.signal.aborted && generation === requestGeneration.current) setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMe();
    return () => { controllerRef.current?.abort(); };
  }, [fetchMe]);

  React.useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea === localStorage && (event.key === DEV_USER_STORAGE_KEY || event.key === null)) {
        setDevUserKeyState(localStorage.getItem(DEV_USER_STORAGE_KEY) ?? "dev-user");
        void fetchMe();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fetchMe]);

  const setDevUserKey = React.useCallback((key: string) => {
    try {
      localStorage.setItem(DEV_USER_STORAGE_KEY, key);
    } catch {
      // localStorage unavailable
    }
    setDevUserKeyState(key);
    fetchMe();
  }, [fetchMe]);

  const isUser = React.useCallback(() => user?.role === "USER", [user]);
  const isContentManager = React.useCallback(
    () => user?.role === "CONTENT_MANAGER",
    [user],
  );
  const isAdmin = React.useCallback(() => user?.role === "ADMIN", [user]);

  const isAuthenticated = user !== null;

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    identityGeneration,
    isUser,
    isContentManager,
    isAdmin,
    devUserKey,
    setDevUserKey,
    refetch: fetchMe,
  };

  const Provider = AuthContext.Provider;

  return (
    <Provider value={value}>
      {children}
    </Provider>
  );
}
