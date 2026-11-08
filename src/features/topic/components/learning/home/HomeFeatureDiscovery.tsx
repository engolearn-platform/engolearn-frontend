import { ArrowRight, BookOpenText, ClipboardList, Compass, Search } from "lucide-react";
import { Link } from "react-router";
import { ROUTES } from "@shared/constants";

const shortcuts = [
  { title: "Khám phá chủ đề", description: "Học từ vựng theo tình huống thực tế.", icon: Compass, to: ROUTES.TOPICS },
  { title: "Ngữ pháp", description: "Học theo lộ trình CEFR.", icon: BookOpenText, to: ROUTES.GRAMMAR, status: "Xem trước" },
  { title: "Kiểm tra trình độ", description: "Xem điều kiện và làm bài đánh giá.", icon: ClipboardList, to: "/assessment" },
  { title: "Tra từ", description: "Tra cứu nhanh từ vựng và ví dụ.", icon: Search, status: "Chưa khả dụng" },
];

export function HomeFeatureDiscovery() {
  return (
    <section aria-labelledby="home-discovery-title" className="space-y-3">
      <h2 id="home-discovery-title" className="text-headline-md font-semibold">Khám phá tính năng học tập</h2>
      <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {shortcuts.map(({ title, description, icon: Icon, to, status }) => {
          const content = (
            <>
              <span className="grid size-9 place-items-center rounded-lg bg-learning-mint text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-label-lg text-on-surface-variant">{description}</p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-1">
                {status && <span className="text-label-sm font-semibold text-on-surface-variant">{status}</span>}
                {to && <ArrowRight className="ml-auto size-4 text-primary" aria-hidden="true" />}
              </div>
            </>
          );
          const cardClass = "flex h-full min-w-0 flex-col gap-2 rounded-2xl border border-learning-outline p-3 sm:p-5";
          return (
            <li key={title}>
              {to ? (
                <Link to={to} className={cardClass + " bg-surface-container-lowest hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"}>
                  {content}
                </Link>
              ) : <div className={cardClass + " bg-surface-container-low"}>{content}</div>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
