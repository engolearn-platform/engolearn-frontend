import type { ReactNode } from "react";

const control = "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
interface TextProps { label: string; value?: string | null; onChange: (value: string) => void; long?: boolean; max?: number }
export function DraftText({label, value, onChange, long, max}: TextProps) {
  const props = {className: control, value: value ?? "", maxLength: max,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => onChange(e.target.value)};
  return <label className="grid gap-1 text-sm font-medium">{label}
    {long ? <textarea rows={3} {...props}/> : <input {...props}/>}</label>;
}
export function DraftSelect({label, value, onChange, children}: {
  label: string; value?: string | null; onChange: (value: string) => void; children: ReactNode;
}) {
  return <label className="grid gap-1 text-sm font-medium">{label}
    <select className={control} value={value ?? ""} onChange={e => onChange(e.target.value)}>
      <option value="">Chưa chọn</option>{children}</select></label>;
}
