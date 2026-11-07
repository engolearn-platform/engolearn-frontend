import { ListChecks } from "lucide-react";
import { Link } from "react-router";
import LearningLayout from "@/core/layouts/LearningLayout";
import { Button } from "@/core/components/shadcn/button";
import GuestLandingView from "@features/landing-page/views/GuestLandingView";
import { ROUTES } from "@shared/constants";
import { useAuth } from "@shared/hooks";

export default function LandingEntryView() {
  const { isAuthenticated, isLoading, error, refetch } = useAuth();

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-surface px-5" aria-busy="true">
        <p role="status" className="rounded-2xl border border-learning-outline bg-white px-6 py-5 text-body-md text-on-surface-variant">
          Đang kiểm tra phiên đăng nhập…
        </p>
      </main>
    );
  }

  if (isAuthenticated) return <LearningLayout />;

  return <GuestLandingView sessionError={Boolean(error)} onRetry={refetch} />;
}

export function PlacementPlaceholderView() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface px-5 py-12">
      <section aria-labelledby="placement-title" className="w-full max-w-xl space-y-5 rounded-3xl border border-learning-outline bg-white p-6 text-center sm:p-10">
        <span aria-hidden="true" className="mx-auto grid size-16 place-items-center rounded-full bg-learning-mint text-primary">
          <ListChecks className="size-8" />
        </span>
        <p className="text-label-lg font-bold uppercase tracking-widest text-primary">EngoLearn</p>
        <h1 id="placement-title" className="text-headline-lg font-bold">Bài kiểm tra trình độ đang được chuẩn bị</h1>
        <p className="text-body-md leading-6 text-on-surface-variant">Tính năng này sẽ được bổ sung sau. Trong lúc chờ, bạn có thể khám phá các chủ đề và bài học ngữ pháp hiện có.</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="min-h-12 rounded-xl"><Link to={ROUTES.HOME}>Về trang chủ</Link></Button>
          <Button asChild variant="outline" className="min-h-12 rounded-xl"><Link to={ROUTES.TOPICS}>Khám phá chủ đề</Link></Button>
        </div>
      </section>
    </main>
  );
}
