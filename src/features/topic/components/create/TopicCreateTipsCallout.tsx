import { Lightbulb } from "lucide-react";

interface TopicCreateTipsCalloutProps {
  title?: string;
  description?: string;
}

export default function TopicCreateTipsCallout({
  title = "Mẹo tạo chủ đề chất lượng cao",
  description = 'Nên gắn ít nhất 3 thẻ chủ đề liên quan và chọn đúng trình độ CEFR. Sau khi nhấn "Tiếp tục", bạn sẽ bắt đầu xây dựng chuỗi 4 bài học nhỏ (Lessons) cụ thể bao gồm từ vựng món ăn, hội thoại gọi món và bài tập phản xạ với giọng bản xứ.',
}: TopicCreateTipsCalloutProps) {
  return (
    <div className="flex items-start gap-4 rounded-xl bg-surface-container-low p-6">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary-fixed text-on-secondary-fixed">
        <Lightbulb className="size-5" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-label-lg font-semibold text-on-surface">{title}</h3>
        <p className="text-body-md leading-relaxed text-on-surface-variant">{description}</p>
      </div>
    </div>
  );
}
