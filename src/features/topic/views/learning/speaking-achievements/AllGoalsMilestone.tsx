import { Sparkles } from "lucide-react";
import { AchievementFireworks } from "./AchievementFireworks";
import type { CelebrationDecision } from "./speakingAchievementLogic";

export function AllGoalsMilestone({ decision, goalTotal, validTurns, minValidTurns, celebrate }: {
  decision: CelebrationDecision;
  goalTotal: number;
  validTurns: number;
  minValidTurns: number;
  celebrate: boolean;
}) {
  if (decision.type !== "ALL_GOALS") return null;
  return <div className="relative mt-3 overflow-hidden rounded-xl border border-secondary-fixed bg-secondary-fixed/35 p-4 text-on-secondary-fixed animate-in fade-in slide-in-from-bottom-1 duration-300 motion-reduce:animate-none">
    {celebrate && <AchievementFireworks major />}
    <p className="flex items-center gap-2 font-semibold"><Sparkles aria-hidden="true" size={19} className="text-secondary" />Xuất sắc! Bạn đã đạt tất cả mục tiêu!</p>
    <p className="mt-1 text-sm text-on-surface-variant">{goalTotal}/{goalTotal} mục tiêu · {validTurns}/{minValidTurns} lượt hợp lệ. Còn {decision.remainingValidTurns} lượt nói hợp lệ để hoàn tất phiên.</p>
    <p className="sr-only" aria-live="polite">Xuất sắc! Bạn đã đạt tất cả mục tiêu. Còn {decision.remainingValidTurns} lượt nói hợp lệ.</p>
  </div>;
}
