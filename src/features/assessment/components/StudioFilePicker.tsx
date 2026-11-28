import { useRef } from "react";
import { Button } from "@/core/components/shadcn/button";

export function StudioFilePicker({label, selection, accept, multiple, disabled, onSelect}: {
  label: string;
  selection?: string;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  onSelect: (files: File[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return <div className="flex flex-wrap items-center gap-2">
    <input ref={input} hidden type="file" aria-label={label} accept={accept} multiple={multiple}
      disabled={disabled} onChange={event => {
        const files = Array.from(event.currentTarget.files ?? []);
        event.currentTarget.value = "";
        if (files.length) onSelect(files);
      }} />
    <Button type="button" variant="outline" disabled={disabled} onClick={() => input.current?.click()}>
      {label}
    </Button>
    {selection && <span role="status" className="min-w-0 break-all text-sm text-muted-foreground">{selection}</span>}
  </div>;
}
