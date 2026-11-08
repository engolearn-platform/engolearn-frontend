import { Button } from "@/core/components/shadcn/button";
import { PLACEMENT_ROUTES } from "@features/placement/constants";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { Link } from "react-router";

export default function PlacementActiveAttemptConflictCard() {
  return (
    <article className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-center sm:p-8">
      <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ClipboardList className="size-7" aria-hidden="true" />
      </span>

      <h1 className="text-headline-lg font-bold tracking-tight text-on-surface">
        Bạn đang có một bài đánh giá đầu vào đang làm dở.
      </h1>
      <p className="mt-2 text-body-md text-on-surface-variant">
        Hãy tiếp tục bài đang làm trước khi sử dụng kết quả của bài Guest này.
      </p>

      <div className="mt-6 flex w-full flex-col gap-3">
        <Button asChild size="lg" className="w-full rounded-xl">
          <Link to={PLACEMENT_ROUTES.ROOT}>
            Tiếp tục bài đang làm
          </Link>
        </Button>
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
