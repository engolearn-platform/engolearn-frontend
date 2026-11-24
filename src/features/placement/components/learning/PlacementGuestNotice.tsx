import { Info } from "lucide-react";

interface PlacementGuestNoticeProps {
  message: string;
}

export default function PlacementGuestNotice({
  message,
}: PlacementGuestNoticeProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-on-surface">
      <Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
      <p className="text-body-md leading-relaxed">{message}</p>
    </div>
  );
}
