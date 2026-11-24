import { ArrowRight, BookOpenText, Headphones, Route, ScanText } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import PublicNavigation from "@shared/components/PublicNavigation";
import { Card } from "@shared/components";
import { ROUTES } from "@shared/constants";
import { useAuth } from "@shared/hooks";

const exampleDays = [
  { title: "Nghe để nắm ý chính", description: "Xác định chủ đề của một đoạn hội thoại ngắn.", icon: Headphones },
  { title: "Đọc để tìm chi tiết", description: "Tìm thời gian, địa điểm hoặc thông tin cụ thể trong đoạn văn.", icon: ScanText },
  { title: "Củng cố hai kỹ năng", description: "Luyện lại các dạng câu hỏi đã gặp trong tuần.", icon: BookOpenText },
];

export default function LearningPathPreviewView() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <PublicNavigation />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:py-12">
        <section aria-labelledby="path-preview-title" className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-learning-mint-border bg-learning-mint p-5 sm:flex-row sm:p-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-label-lg font-semibold text-primary">Bản xem trước</p>
            <h1 id="path-preview-title" className="text-headline-lg font-bold">Lộ trình luyện tập</h1>
            <p className="text-body-md text-on-surface-variant">
              Lộ trình tập trung vào những kỹ năng nghe và đọc cần cải thiện sau bài đánh giá định kỳ. Mỗi buổi luyện giúp bạn tập trung vào một mục tiêu cụ thể.
            </p>
          </div>
          <span aria-hidden="true" className="hidden size-16 shrink-0 place-items-center rounded-2xl border border-learning-mint-border bg-surface-container-lowest text-primary sm:grid">
            <Route className="size-8" />
          </span>
        </section>
        <section aria-labelledby="example-week-title" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="example-week-title" className="text-headline-md font-semibold">Một tuần luyện tập</h2>
            <span className="rounded-full bg-learning-note px-3 py-1 text-label-sm font-semibold text-learning-note-ink">Ví dụ</span>
          </div>
          <p className="text-body-md text-on-surface-variant">Các buổi dưới đây minh họa cách một tuần luyện có thể được sắp xếp.</p>
          <ol className="grid gap-4 md:grid-cols-3">
            {exampleDays.map(({ title, description, icon: Icon }, index) => (
              <li key={title}>
                <Card className="h-full space-y-3 rounded-2xl border-learning-outline bg-surface-container-lowest p-5">
                  <span className="flex items-center gap-2 text-label-lg font-semibold text-primary">
                    <Icon className="size-5" aria-hidden="true" /> Buổi {index + 1}
                  </span>
                  <h3 className="text-headline-sm font-semibold">{title}</h3>
                  <p className="text-body-md text-on-surface-variant">{description}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>
        <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-learning-outline bg-surface-container-lowest p-5 sm:flex-row sm:items-center">
          <p className="text-body-md font-semibold">Xem lộ trình dành cho tài khoản của bạn</p>
          <Button asChild className="min-h-12 whitespace-normal rounded-xl">
            {isAuthenticated ? <Link to={ROUTES.LEARNING_PATHS}>Mở lộ trình của tôi<ArrowRight aria-hidden="true" /></Link> : (
              <Link to={ROUTES.LOGIN} state={{ from: { pathname: ROUTES.LEARNING_PATHS } }}>Đăng nhập để xem lộ trình<ArrowRight aria-hidden="true" /></Link>
            )}
          </Button>
        </section>
      </main>
    </div>
  );
}
