import LearningLayout from "@/core/layouts/LearningLayout";
import { useAuth } from "@shared/hooks/useAuth";

export default function AssessmentLearningLayout() {
  const { user } = useAuth();
  return <LearningLayout
    profile={{ name: user?.email ?? "Người học", level: null, authenticated: !!user }}
    header={<header className="flex min-h-20 items-center justify-between gap-4 border-b border-learning-outline bg-white p-5"><strong className="text-primary">Đánh giá định kỳ</strong><span className="truncate text-sm">{user?.email}</span></header>}
  />;
}
