import { PLACEMENT_ROUTES } from "@features/placement/constants";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "react-router";
import PlacementClaimAuthActions from "./PlacementClaimAuthActions";

/**
 * CLAIMABLE state (BR-F2.3/F2.4): the Guest finished the test but must
 * authenticate so the backend can auto-claim the result (BR-F2.6).
 */
export default function PlacementClaimCard({
  onLogin,
  onRegister,
  claiming,
}: {
  onLogin: () => void;
  onRegister: () => void;
  claiming: boolean;
}) {
  return (
    <article className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-center sm:p-8">
      <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="size-7" aria-hidden="true" />
      </span>

      <h1 className="text-headline-lg font-bold tracking-tight text-on-surface">
        Bạn đã hoàn thành bài kiểm tra
      </h1>
      <p className="mt-2 text-body-md text-on-surface-variant">
        Đăng nhập hoặc tạo tài khoản để xem trình độ được đề xuất và xem lại bài
        làm.
      </p>

      <p className="mt-4 inline-block rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-label-sm text-on-surface-variant">
        Kết quả của bạn được giữ trong 2 giờ kể từ khi bài thi kết thúc.
      </p>

      <PlacementClaimAuthActions onLogin={onLogin} onRegister={onRegister} claiming={claiming} />

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
