import { TopicCard } from "../components/TopicCard";
import TopicFilterChips from "../components/TopicFilterChips";
import type { TopicCardProps } from "../components/TopicCard";

const topics: TopicCardProps[] = [
  {
    id: "1",
    title: "Thói quen hằng ngày",
    imgSrc: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=600&q=80",
    status: "inProgress",
    vocabCount: 12,
    duration: "15 phút",
    progress: 60,
    linkLabel: "Hiện tại đơn",
  },
  {
    id: "2",
    title: "Đồ ăn & Thức uống",
    imgSrc: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80",
    status: "completed",
    vocabCount: 60,
    duration: "20 phút",
    linkLabel: "Danh từ đếm được",
  },
  {
    id: "3",
    title: "Gia đình",
    imgSrc: "",
    status: "locked",
    vocabCount: 50,
    duration: "25 phút",
    linkLabel: "Tính từ sở hữu",
  },
];

export default function MainContent() {
  return (
    <div className="flex-1 p-margin-page lg:p-8 xl:p-10 space-y-6 md:space-y-8">
      {/* Page Heading */}
      <div className="space-y-2">
        <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">Khám phá chủ đề</h1>
        <p className="text-body-md text-on-surface-variant">
          Chọn một chủ đề để bắt đầu bài học hôm nay.
        </p>
      </div>

      {/* Filter Chips Section */}
      <div>
        <TopicFilterChips />
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3">
        {topics.map((t) => (
          <TopicCard key={t.id} {...t} />
        ))}
      </div>
    </div>
  );
}
