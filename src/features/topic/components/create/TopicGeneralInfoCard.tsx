import { ChevronDown, Clock, Languages } from "lucide-react";
import { cn } from "@shared/utils";
import type { CefrLevel } from "../../types/topic.types";
import type {
  TopicBasicInfoDraft,
  TopicCategoryOption,
} from "../../types/topic-create.types";
import { TOPIC_CREATE_CEFR_OPTIONS } from "../../types/topic-create.types";
import CefrLevelSelector from "./CefrLevelSelector";

interface TopicGeneralInfoCardProps {
  draft: TopicBasicInfoDraft;
  categories: TopicCategoryOption[];
  maxDescription: number;
  showErrors?: boolean;
  onPatch: (patch: Partial<TopicBasicInfoDraft>) => void;
  onCefrChange: (cefr: CefrLevel) => void;
}

const FIELD_CLASS =
  "w-full rounded-lg bg-surface-container-low px-4 py-3 text-body-md text-on-surface shadow-xs transition-all placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none";

function RequiredMark() {
  return (
    <span className="text-error" aria-hidden="true">
      *
    </span>
  );
}

export default function TopicGeneralInfoCard({
  draft,
  categories,
  maxDescription,
  showErrors = false,
  onPatch,
  onCefrChange,
}: TopicGeneralInfoCardProps) {
  const titleEnError = showErrors && draft.titleEn.trim().length === 0;
  const titleViError = showErrors && draft.titleVi.trim().length === 0;
  const durationError = showErrors && draft.duration.trim().length === 0;
  const descriptionError = showErrors && draft.description.trim().length === 0;

  return (
    <section className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-5 shadow-sm sm:p-8">
      <div className="flex items-center justify-between border-b border-surface-container pb-2">
        <div className="flex items-center gap-2.5">
          <Languages className="size-6 text-primary" aria-hidden="true" />
          <h2 className="text-headline-sm font-semibold text-on-surface">
            Thông tin chung của chủ đề
          </h2>
        </div>
        <span className="text-label-sm font-medium text-error">* Trường bắt buộc</span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="topic-en"
            className="flex items-center gap-2 text-label-lg font-semibold text-on-surface"
          >
            Tên chủ đề (Tiếng Anh)
            <RequiredMark />
          </label>
          <div className="relative">
            <input
              id="topic-en"
              type="text"
              value={draft.titleEn}
              onChange={(event) => onPatch({ titleEn: event.target.value })}
              placeholder="e.g. Asking for Directions"
              aria-invalid={titleEnError}
              className={cn(FIELD_CLASS, titleEnError && "ring-2 ring-error")}
            />
            <span className="absolute top-3.5 right-3.5 text-label-sm text-on-surface-variant uppercase">
              EN
            </span>
          </div>
          {titleEnError ? (
            <p className="text-label-sm text-error">Vui lòng nhập tên chủ đề tiếng Anh.</p>
          ) : (
            <p className="text-label-sm text-on-surface-variant">
              Hiển thị chính trong giáo trình và bài kiểm tra nói.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="topic-vi"
            className="flex items-center gap-2 text-label-lg font-semibold text-on-surface"
          >
            Tên chủ đề (Tiếng Việt)
            <RequiredMark />
          </label>
          <div className="relative">
            <input
              id="topic-vi"
              type="text"
              value={draft.titleVi}
              onChange={(event) => onPatch({ titleVi: event.target.value })}
              placeholder="Ví dụ: Chỉ đường & Giao thông"
              aria-invalid={titleViError}
              className={cn(FIELD_CLASS, titleViError && "ring-2 ring-error")}
            />
            <span className="absolute top-3.5 right-3.5 text-label-sm text-on-surface-variant uppercase">
              VI
            </span>
          </div>
          {titleViError ? (
            <p className="text-label-sm text-error">Vui lòng nhập tên chủ đề tiếng Việt.</p>
          ) : (
            <p className="text-label-sm text-on-surface-variant">
              Dành cho người học sơ cấp và phụ đề hướng dẫn.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-label-lg font-semibold text-on-surface">
            Trình độ CEFR mục tiêu
            <RequiredMark />
          </span>
          <span className="text-label-sm font-medium text-primary">
            Khung tham chiếu Châu Âu
          </span>
        </div>
        <CefrLevelSelector
          value={draft.cefr}
          options={TOPIC_CREATE_CEFR_OPTIONS}
          onChange={onCefrChange}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="topic-category"
            className="flex items-center gap-2 text-label-lg font-semibold text-on-surface"
          >
            Danh mục học tập (Category)
            <RequiredMark />
          </label>
          <div className="relative">
            <select
              id="topic-category"
              value={draft.category}
              onChange={(event) => onPatch({ category: event.target.value })}
              className={cn(FIELD_CLASS, "cursor-pointer appearance-none pr-10")}
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-3.5 right-3.5 size-5 text-on-surface-variant"
              aria-hidden="true"
            />
          </div>
          <p className="text-label-sm text-on-surface-variant">
            Giúp học viên lọc chủ đề theo nhu cầu thực tế trên ứng dụng di động.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="estimated-time"
            className="flex items-center gap-2 text-label-lg font-semibold text-on-surface"
          >
            Thời lượng học ước tính
            <RequiredMark />
          </label>
          <div className="relative">
            <input
              id="estimated-time"
              type="text"
              value={draft.duration}
              onChange={(event) => onPatch({ duration: event.target.value })}
              placeholder="Khoảng 45 phút học (4 bài học nhỏ)"
              aria-invalid={durationError}
              className={cn(FIELD_CLASS, durationError && "ring-2 ring-error")}
            />
            <Clock
              className="pointer-events-none absolute top-3.5 right-3.5 size-5 text-on-surface-variant"
              aria-hidden="true"
            />
          </div>
          {durationError ? (
            <p className="text-label-sm text-error">Vui lòng nhập thời lượng học ước tính.</p>
          ) : (
            <p className="text-label-sm text-on-surface-variant">
              Tối ưu cho nhịp độ học tập Micro-learning (10-15 phút/phiên).
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="topic-desc"
            className="flex items-center gap-2 text-label-lg font-semibold text-on-surface"
          >
            Mô tả ngắn chủ đề (Topic Description)
            <RequiredMark />
          </label>
          <span className="text-label-sm text-on-surface-variant">
            {draft.description.length} / {maxDescription} ký tự
          </span>
        </div>
        <textarea
          id="topic-desc"
          rows={3}
          value={draft.description}
          maxLength={maxDescription}
          onChange={(event) => onPatch({ description: event.target.value })}
          placeholder="Mô tả mục tiêu người học sẽ đạt được sau khi hoàn thành chuỗi bài..."
          aria-invalid={descriptionError}
          className={cn(FIELD_CLASS, "resize-none", descriptionError && "ring-2 ring-error")}
        />
        {descriptionError && (
          <p className="text-label-sm text-error">Vui lòng nhập mô tả ngắn cho chủ đề.</p>
        )}
      </div>
    </section>
  );
}
