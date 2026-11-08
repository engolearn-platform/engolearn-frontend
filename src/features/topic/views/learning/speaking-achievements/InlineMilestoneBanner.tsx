import { Flag, PartyPopper } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import type { CelebrationDecision } from "./speakingAchievementLogic";

export function InlineMilestoneBanner({ decision, onFinish }: {
  decision: CelebrationDecision;
  onFinish: () => void;
}) {
  if (decision.type !== "REQUIRED_MILESTONE" && decision.type !== "ELIGIBLE_TO_FINISH") return null;
  const eligible = decision.type === "ELIGIBLE_TO_FINISH";
  const heading = eligible ? "Bạn đã đủ điều kiện hoàn thành!" : "Đã đạt tất cả mục tiêu bắt buộc!";
  const detail = eligible
    ? "Bạn có thể tiếp tục luyện mục tiêu tùy chọn hoặc kết thúc phiên khi sẵn sàng."
    : `Còn ${decision.remainingValidTurns} lượt nói hợp lệ.`;

  return <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-fixed-dim bg-primary-fixed/20 p-3 text-sm text-on-primary-fixed animate-in fade-in slide-in-from-bottom-1 duration-300 motion-reduce:animate-none">
    <div className="flex gap-2"><span className="mt-0.5 text-primary">{eligible ? <PartyPopper aria-hidden="true" size={18} /> : <Flag aria-hidden="true" size={18} />}</span>
      <div><p className="font-semibold">{heading}</p><p className="mt-0.5 text-on-surface-variant">{detail}</p></div>
    </div>
    {eligible && <Button type="button" size="sm" onClick={onFinish}>Kết thúc phiên</Button>}
    <p className="sr-only" aria-live="polite">{heading} {detail}</p>
  </div>;
}
