// M3.6.1 - ORIGINAL
// import { useState, type FormEvent } from "react";
// import { Link, useLocation, useNavigate } from "react-router";
// M3.6.1 - FIX
import { useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { ROUTES } from "@shared/constants";
import { useAuth } from "@shared/hooks";

interface AuthFormProps { mode: "login" | "register" }
// M3.6.1 - ORIGINAL
// interface LocationState { from?: { pathname?: string; search?: string; hash?: string } }
// M3.6.1 - FIX: return-to shape validation moved to auth-return-to.ts; no local type needed.
interface FieldError { field: string; message: string }

/* M3.6.1 - ORIGINAL
function safeReturnTo(state: unknown): string {
  const from = (state as LocationState | null)?.from;
  const target = `${from?.pathname ?? ""}${from?.search ?? ""}${from?.hash ?? ""}`;
  return target.startsWith("/") && !target.startsWith("//") && !target.startsWith("/login") && !target.startsWith("/register") ? target : ROUTES.HOME;
}
*/
// M3.6.1 - FIX: getAuthReturnTo in auth-return-to.ts replaces this helper; GuestOnlyGuard alone uses it.

export default function AuthForm({ mode }: AuthFormProps) {
  const isRegister = mode === "register";
  const { login, register } = useAuth();
  // M3.6.1 - ORIGINAL
  // const navigate = useNavigate();
  // M3.6.1 - FIX: no form navigator; GuestOnlyGuard performs the post-auth redirect.
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  // M3.6.1 - FIX: new synchronous submission lock complements the existing busy state.
  const submissionPendingRef = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const emailError = fieldErrors.find(error => error.field.toLowerCase().includes("email"))?.message;
  const passwordError = fieldErrors.find(error => error.field.toLowerCase().includes("password"))?.message;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // M3.6.1 - ORIGINAL
    // if (busy) return;
    // M3.6.1 - FIX
    if (busy || submissionPendingRef.current) return;
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || !password) {
      setFieldErrors([
        ...(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ? [{ field: "email", message: "Enter a valid email address." }] : []),
        ...(!password ? [{ field: "password", message: "Enter your password." }] : []),
      ]);
      setMessage(null);
      return;
    }
    setBusy(true); setMessage(null); setFieldErrors([]);
    if (isRegister && password !== confirmPassword) {
      setFieldErrors([{ field: "confirmPassword", message: "Passwords do not match." }]);
      setBusy(false);
      return;
    }
    // M3.6.1 - FIX: acquire the new lock only after existing validation succeeds.
    submissionPendingRef.current = true;
    try {
      const credentials = { email: normalizedEmail, password };
      if (isRegister) await register(credentials); else await login(credentials);
      // M3.6.1 - ORIGINAL
      // await navigate(safeReturnTo(location.state), { replace: true });
      // M3.6.1 - FIX: removed competing navigation; GuestOnlyGuard owns this redirect.
    } catch (error) {
      const detail = error as Error & { code?: string; fieldErrors?: FieldError[] };
      setFieldErrors(detail.fieldErrors ?? []);
      if (detail.code === "INVALID_CREDENTIALS") setMessage("Email or password is incorrect.");
      else if (detail.code === "EMAIL_ALREADY_EXISTS") setMessage("An account already uses this email. Sign in instead.");
      else if (detail.code === "ACCOUNT_LOCKED") setMessage("This account is locked. Contact support for help.");
      else setMessage(detail.message || "Could not complete your request. Try again.");
    // M3.6.1 - ORIGINAL
    // } finally { setBusy(false); }
    // M3.6.1 - FIX
    } finally { submissionPendingRef.current = false; setBusy(false); }
  }

  return <main className="min-h-screen bg-surface px-5 py-12 text-on-surface">
    <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-5xl items-center gap-12 lg:grid-cols-[1fr_420px]">
      <section className="max-w-xl">
        <Link to={ROUTES.HOME} className="text-lg font-bold text-primary focus-visible:outline-2 focus-visible:outline-primary">Engo Learn</Link>
        <h1 className="mt-10 text-3xl leading-tight font-bold sm:text-4xl">{isRegister ? "Start learning at your pace." : "Welcome back to your learning journey."}</h1>
        <p className="mt-4 max-w-lg text-base leading-7 text-on-surface-variant">{isRegister ? "Create an account to keep your learning progress together." : "Sign in to continue where you left off."}</p>
      </section>
      <section className="rounded-2xl border border-learning-outline bg-white p-6 sm:p-8">
        <h2 className="text-2xl font-semibold">{isRegister ? "Create your account" : "Sign in"}</h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">{isRegister ? "Use your email address and choose a password." : "Enter the email and password for your account."}</p>
        <form className="mt-7 space-y-5" onSubmit={onSubmit} noValidate>
          <div className="space-y-2"><label htmlFor="auth-email" className="text-sm font-semibold">Email</label><input id="auth-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} aria-invalid={Boolean(emailError)} aria-describedby={emailError ? "auth-email-error" : undefined} className="min-h-12 w-full rounded-md border border-outline-variant bg-white px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary" />{emailError && <p id="auth-email-error" className="text-sm text-error">{emailError}</p>}</div>
          <div className="space-y-2"><label htmlFor="auth-password" className="text-sm font-semibold">Password</label><input id="auth-password" name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} required value={password} onChange={event => setPassword(event.target.value)} aria-invalid={Boolean(passwordError)} aria-describedby={passwordError ? "auth-password-error" : undefined} className="min-h-12 w-full rounded-md border border-outline-variant bg-white px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary" />{passwordError && <p id="auth-password-error" className="text-sm text-error">{passwordError}</p>}</div>
          {isRegister && <div className="space-y-2"><label htmlFor="auth-confirm-password" className="text-sm font-semibold">Confirm password</label><input id="auth-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} aria-invalid={fieldErrors.some(error => error.field === "confirmPassword")} className="min-h-12 w-full rounded-md border border-outline-variant bg-white px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary" />{fieldErrors.find(error => error.field === "confirmPassword") && <p className="text-sm text-error">{fieldErrors.find(error => error.field === "confirmPassword")?.message}</p>}</div>}
          {message && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm leading-6 text-error">{message}</p>}
          <Button className="min-h-12 w-full rounded-md bg-primary text-base font-semibold text-on-primary" disabled={busy} type="submit">{busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-on-surface-variant">{isRegister ? "Already have an account?" : "New to Engo Learn?"} {" "}<Link className="font-semibold text-primary underline-offset-4 hover:underline" to={isRegister ? ROUTES.LOGIN : ROUTES.REGISTER} state={location.state}>{isRegister ? "Sign in" : "Create an account"}</Link></p>
      </section>
    </div>
  </main>;
}
