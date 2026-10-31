import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export const fieldClass = "w-full min-w-0 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:bg-muted disabled:text-muted-foreground";
export function Field({ label, error, children, id }: { label: string; error?: string; children: ReactNode; id: string }) {
  return <div className="min-w-0 space-y-2"><label htmlFor={id} className="block font-semibold leading-6">{label}</label>{children}{error && <p className="text-sm leading-6 text-destructive" id={`${id}-error`}>{error}</p>}</div>;
}
export function TextField({ label, error, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; id: string }) {
  return <Field label={label} error={error} id={id}><input {...props} id={id} name={id} className={fieldClass} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} /></Field>;
}
export function SelectField({ label, error, id, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; id: string }) {
  return <Field label={label} error={error} id={id}><select {...props} id={id} name={id} className={fieldClass} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}>{children}</select></Field>;
}
export function VietnamTime({ value }: { value: string }) {
  return <time dateTime={value}>{new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "medium" }).format(new Date(value))}</time>;
}
