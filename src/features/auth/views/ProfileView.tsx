import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { RefreshCw, UserRound } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { Card } from "@shared/components/Card";
import { ROUTES } from "@shared/constants";
import { useAuth } from "@shared/hooks";

type User = { id: string; email: string; role: "USER" | "CONTENT_MANAGER" | "ADMIN" };
type AuthPath = "login" | "register";
type ApiError = Error & { status?: number; code?: string; fieldErrors?: Array<{ field: string; message: string }> };

function parseUser(value: unknown): User {
  if (!value || typeof value !== "object") throw new Error("The server returned an invalid user profile.");
  const user = value as Partial<User>;
  if (typeof user.id !== "string" || !user.id.trim() || typeof user.email !== "string" || !user.email.trim() || !["USER", "CONTENT_MANAGER", "ADMIN"].includes(user.role ?? "")) {
    throw new Error("The server returned an invalid user profile.");
  }
  return user as User;
}

function responseData(payload: unknown): unknown {
  if (!payload || typeof payload !== "object" || !("data" in payload)) throw new Error("The server returned an invalid response.");
  return (payload as { data: unknown }).data;
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(path, { ...init, cache: "no-store", credentials: "same-origin", headers: { Accept: "application/json", ...init?.headers } });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }
  if (response.ok) return response;

  let payload: { code?: string; message?: string; detail?: string; title?: string; fieldErrors?: Array<{ field: string; message: string }> } = {};
  try {
    const body = await response.clone().json() as { code?: string; message?: string; detail?: string; title?: string; fieldErrors?: Array<{ field: string; message: string }>; errors?: Record<string, string[]> };
    payload = { ...body, fieldErrors: body.fieldErrors ?? Object.entries(body.errors ?? {}).flatMap(([field, messages]) => messages.map((message) => ({ field, message }))) };
  } catch { /* A status message is enough when no JSON body is available. */ }
  const error = new Error(payload.message || payload.detail || payload.title || `Request failed (${response.status}). Try again.`) as ApiError;
  error.status = response.status;
  error.code = payload.code;
  error.fieldErrors = payload.fieldErrors;
  throw error;
}

async function getMe(): Promise<User> {
  const response = await request("/api/v1/auth/me");
  return parseUser(responseData(await response.json()));
}

async function withAuthLock<T>(operation: () => Promise<T>): Promise<T> {
  if (navigator.locks) return navigator.locks.request("engolearn-profile-auth", operation);
  return operation();
}

async function checkSession(): Promise<User | null> {
  try { return await getMe(); }
  catch (error) {
    if ((error as ApiError).status !== 401) throw error;
  }

  return withAuthLock(async () => {
    try { return await getMe(); } catch (error) {
      if ((error as ApiError).status !== 401) throw error;
    }
    try {
      await request("/api/v1/auth/refresh", { method: "POST" });
    } catch (error) {
      if ((error as ApiError).status === 401) return null;
      throw error;
    }
    return getMe();
  });
}

async function refreshSession(): Promise<User | null> {
  return withAuthLock(async () => {
    try {
      await request("/api/v1/auth/refresh", { method: "POST" });
    } catch (error) {
      if ((error as ApiError).status === 401) return null;
      throw error;
    }
    return getMe();
  });
}

async function authenticate(path: AuthPath, email: string, password: string): Promise<User> {
  return withAuthLock(async () => {
    const response = await request(`/api/v1/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const user = parseUser(responseData(await response.json()));
    return user;
  });
}

export default function ProfileView() {
  const { refetch } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<AuthPath>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [logoutUncertain, setLogoutUncertain] = useState(false);
  const generation = useRef(0);

  const refreshIdentity = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    setMessage(null);
    try {
      const nextUser = await checkSession();
      if (generation.current === current) setUser(nextUser);
    } catch (error) {
      if (generation.current === current) setMessage(error instanceof Error ? error.message : "Could not check your session. Try again.");
    } finally {
      if (generation.current === current) setLoading(false);
    }
  }, []);

  const explicitlyRefresh = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true); setMessage(null);
    try {
      const nextUser = await refreshSession();
      if (generation.current === current) setUser(nextUser);
    } catch (error) {
      if (generation.current === current) setMessage(error instanceof Error ? error.message : "Could not refresh your session. Try again.");
    } finally {
      if (generation.current === current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshIdentity();
    return () => { generation.current += 1; };
  }, [refreshIdentity]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || !password) {
      setMessage("Enter a valid email address and password.");
      return;
    }
    if (mode === "register" && (password.length < 8 || new TextEncoder().encode(password).length > 72)) {
      setMessage("For account creation, use at least 8 characters and no more than 72 UTF-8 bytes.");
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    const current = ++generation.current;
    setPending(true); setMessage(null); setNotice(null);
    try {
      const nextUser = await authenticate(mode, normalizedEmail, password);
      if (generation.current === current) {
        setUser(nextUser); setPassword(""); setConfirmPassword(""); setEmail(nextUser.email);
        refetch();
      }
    } catch (error) {
      if (generation.current === current) {
        const authError = error as ApiError;
        const knownMessage = authError.code === "INVALID_CREDENTIALS" ? "Email or password is incorrect." : authError.code === "EMAIL_ALREADY_EXISTS" ? "An account already uses this email. Sign in instead." : null;
        const fieldMessages = authError.fieldErrors?.map((field) => field.message).filter(Boolean).join(" ");
        setMessage(knownMessage || fieldMessages || authError.message || "Could not complete your request. Try again.");
      }
    } finally {
      if (generation.current === current) setPending(false);
    }
  }

  async function logout() {
    if (pending) return;
    const current = ++generation.current;
    setPending(true); setUser(null); setMessage(null); setNotice(null); setLogoutUncertain(false);
    try {
      await withAuthLock(async () => {
        await request("/api/v1/auth/logout", { method: "POST" });
      });
      if (generation.current === current) { setNotice("You are signed out."); setLogoutUncertain(false); }
    } catch (error) {
      if (generation.current === current) { setNotice(`Signed out on this page; server sign-out could not be confirmed. ${error instanceof Error ? error.message : "Try again."}`); setLogoutUncertain(true); }
    } finally {
      refetch();
      if (generation.current === current) setPending(false);
    }
  }

  return <main className="min-h-screen bg-surface px-5 py-8 text-on-surface">
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link to={ROUTES.HOME} className="self-start text-body-md font-semibold text-primary underline-offset-4 hover:underline">← Trang chủ</Link>
      <header className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary"><UserRound aria-hidden="true" /></span>
        <div><h1 className="text-headline-lg font-bold">Profile</h1><p className="text-body-md text-on-surface-variant">Thông tin tài khoản và phiên đăng nhập</p></div>
      </header>
      {loading && <p role="status" className="text-body-md text-on-surface-variant">Checking your session…</p>}
      {!loading && !user && <Card className="rounded-2xl border-outline-variant bg-surface-container-lowest p-5">
        {message && <div className="mb-4 flex flex-col gap-2"><p role="alert" className="rounded-md bg-error-container px-3 py-2 text-body-md text-on-error-container">{message}</p><Button type="button" variant="outline" className="min-h-12 self-start" disabled={pending} onClick={() => { void refreshIdentity(); }}>Retry session check</Button></div>}
        <h2 className="text-headline-md font-semibold">{mode === "login" ? "Sign in" : "Create your account"}</h2>
        <p className="mt-2 text-body-md text-on-surface-variant">{mode === "login" ? "Enter your account details to check your server session." : "Create an account to start learning."}</p>
        <form className="mt-5 flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="flex flex-col gap-2"><label htmlFor="profile-email" className="text-body-md font-semibold">Email</label><input id="profile-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} disabled={pending} className="min-h-12 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60" /></div>
          <div className="flex flex-col gap-2"><label htmlFor="profile-password" className="text-body-md font-semibold">Password</label><input id="profile-password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required value={password} onChange={(event) => setPassword(event.target.value)} disabled={pending} className="min-h-12 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60" />{mode === "register" && <p className="text-body-md text-on-surface-variant">Use at least 8 characters and no more than 72 UTF-8 bytes.</p>}</div>
          {mode === "register" && <div className="flex flex-col gap-2"><label htmlFor="profile-confirm-password" className="text-body-md font-semibold">Confirm password</label><input id="profile-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={pending} className="min-h-12 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60" /></div>}
          {notice && <p role="status" className="text-body-md text-on-surface-variant">{notice}</p>}
          {logoutUncertain && <Button type="button" variant="outline" className="min-h-12 self-start" disabled={pending} onClick={() => { void logout(); }}>Retry server sign-out</Button>}
          <Button className="min-h-12 w-full" disabled={pending} type="submit">{pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</Button>
        </form>
        <p className="mt-5 text-body-md text-on-surface-variant">{mode === "login" ? "New to Engo Learn?" : "Already have an account?"} {" "}<button type="button" className="font-semibold text-primary underline-offset-4 hover:underline" disabled={pending} onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(null); }}>{mode === "login" ? "Create an account" : "Sign in"}</button></p>
      </Card>}
      {!loading && user && <>
        <Card className="rounded-2xl border-outline-variant bg-surface-container-lowest p-5">
          <p className="mb-5 text-body-md font-semibold text-primary" role="status">Đã đăng nhập · Dữ liệu từ máy chủ</p>
          <dl className="flex flex-col gap-5 text-body-md">
            <div><dt className="text-on-surface-variant">Email</dt><dd className="break-all font-semibold">{user.email}</dd></div>
            <div><dt className="text-on-surface-variant">Vai trò</dt><dd className="font-semibold">{user.role}</dd></div>
            <div><dt className="text-on-surface-variant">User ID</dt><dd className="break-all font-mono">{user.id}</dd></div>
          </dl>
        </Card>
        <section aria-labelledby="session-check" className="flex flex-col gap-4">
          <div><h2 id="session-check" className="text-headline-md font-semibold">Kiểm tra phiên</h2><p className="mt-2 text-body-md text-on-surface-variant">Tải lại trang hoặc kiểm tra phiên để xác nhận danh tính máy chủ.</p></div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button className="min-h-12" disabled={pending || loading} onClick={() => { void refreshIdentity(); }}><RefreshCw aria-hidden="true" />Kiểm tra phiên</Button>
            <Button variant="outline" className="min-h-12" disabled={pending || loading} onClick={() => { void explicitlyRefresh(); }}>Refresh session</Button>
            <Button variant="outline" className="min-h-12" disabled={pending} onClick={() => window.location.reload()}>Tải lại trang</Button>
            <Button variant="outline" className="min-h-12" disabled={pending} onClick={() => { void logout(); }}>Đăng xuất</Button>
          </div>
          {message && <p role="alert" className="rounded-md bg-error-container px-3 py-2 text-body-md text-on-error-container">{message} <button type="button" className="font-semibold underline" disabled={pending} onClick={() => { void refreshIdentity(); }}>Try again</button></p>}
          {notice && <p role="status" className="text-body-md text-on-surface-variant">{notice}</p>}
        </section>
      </>}
    </div>
  </main>;
}
