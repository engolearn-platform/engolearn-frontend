import LearningLayout from "@/core/layouts/LearningLayout";
import GuestLandingView from "@features/landing-page/views/GuestLandingView";
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
