import { Button } from "@/core/components/shadcn/button";
import { PLACEMENT_ROUTES } from "@features/placement/constants";
import type { PlacementClaimStatus } from "@features/placement/types/placement-claim.types";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Info,
  ShieldAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";

interface StatusCopy {
  icon: LucideIcon;
  tone: "info" | "warning";
  title: string;
  description: string;
  canRetry: boolean;
  canViewResult: boolean;
}

const STATUS_COPY: Record<
  Exclude<PlacementClaimStatus, "CLAIMABLE">,
  StatusCopy
> = {
  CLAIM_EXPIRED: {
    icon: Clock,
    tone: "warning",
    title: "Kết quả đã hết thời gian lưu",
    description: "Cửa sổ 2 giờ để nhận kết quả đã kết thúc.",
    canRetry: false,
    canViewResult: false,
  },
  SESSION_MISMATCH: {
    icon: ShieldAlert,
    tone: "warning",
    title: "Không thể nhận kết quả trên phiên này",
    description: "Phiên làm bài không còn khớp với bài kiểm tra.",
    canRetry: false,
    canViewResult: false,
  },
  OWNED_BY_OTHER: {
    icon: ShieldAlert,
    tone: "warning",
    title: "Bài làm đã thuộc tài khoản khác",
    description:
      "Bài kiểm tra này đã được gắn với một tài khoản khác nên không thể nhận lại.",
    canRetry: false,
    canViewResult: false,
  },
  ALREADY_CLAIMED: {
    icon: CheckCircle2,
    tone: "info",
    title: "Kết quả đã được lưu vào tài khoản",
    description:
      "Kết quả của bài kiểm tra này đã được ghi nhận cho tài khoản của bạn.",
    canRetry: false,
    canViewResult: true,
  },
  USER_HAS_RESULT: {
    icon: Info,
    tone: "info",
    title: "Tài khoản đã có kết quả đánh giá",
    description:
      "Mỗi tài khoản chỉ có một kết quả đánh giá. Kết quả hiện tại của bạn vẫn được giữ nguyên.",
    canRetry: false,
    canViewResult: true,
  },
  NO_RESULT: {
    icon: Clock,
    tone: "warning",
    title: "Bài làm không có câu trả lời",
    description:
      "Bạn chưa trả lời câu hỏi nào nên bài làm không được tính điểm.",
    canRetry: true,
    canViewResult: false,
  },
};

interface PlacementClaimStatusCardProps {
  claimStatus: Exclude<PlacementClaimStatus, "CLAIMABLE">;
}

export default function PlacementClaimStatusCard({
  claimStatus,
}: PlacementClaimStatusCardProps) {
  const copy = STATUS_COPY[claimStatus];
  const Icon = copy.icon;
  const toneClass =
    copy.tone === "warning"
      ? "bg-error-container text-on-error-container"
      : "bg-primary/10 text-primary";

  return (
    <article className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-center sm:p-8">
      <span
        className={`mx-auto mb-5 flex size-14 items-center justify-center rounded-full ${toneClass}`}
      >
        <Icon className="size-7" aria-hidden="true" />
      </span>

      <h1 className="text-headline-lg font-bold tracking-tight text-on-surface">
        {copy.title}
      </h1>
      <p className="mt-2 text-body-md text-on-surface-variant">
        {copy.description}
      </p>

      <div className="mt-6 flex w-full flex-col gap-3">
        {copy.canRetry ? (
          <Button asChild size="lg" className="w-full rounded-xl">
            <Link to={PLACEMENT_ROUTES.ROOT}>Làm lại bài kiểm tra</Link>
          </Button>
        ) : null}
        {copy.canViewResult ? (
          <Button
            type="button"
            size="lg"
            disabled
            title="Sắp ra mắt"
            className="w-full rounded-xl"
          >
            Xem kết quả của bạn
          </Button>
        ) : null}
      </div>

      <div className="mt-4">
        <Link
          to={PLACEMENT_ROUTES.ROOT}
          className="inline-flex items-center gap-1.5 text-label-lg text-on-surface-variant transition-colors hover:text-on-surface"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Về trang đánh giá đầu vào
        </Link>
      </div>
    </article>
  );
}
