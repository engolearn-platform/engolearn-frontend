import PlacementChecklist from "@features/placement/components/learning/PlacementChecklist";
import PlacementInfoGrid from "@features/placement/components/learning/PlacementInfoGrid";
import PlacementStartCta from "@features/placement/components/learning/PlacementStartCta";
import { PLACEMENT_INTRO_INFO, PLACEMENT_INTRO_RULES } from "@features/placement/constants";
import { Link } from "react-router";

export default function PlacementUserStartContent({ onStart, starting, error }: {
  onStart: () => void;
  starting: boolean;
  error: string | null;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-8 lg:py-10">
      <div className="flex flex-col gap-2">
        <nav aria-label="Đường dẫn trang" className="flex items-center gap-2 text-label-sm text-on-surface-variant">
          <Link to="/" className="hover:text-primary">Trang chủ</Link><span aria-hidden="true">/</span>
          <span aria-current="page" className="font-semibold text-on-surface">Kiểm tra trình độ</span>
        </nav>
        <h1 className="text-headline-lg font-bold text-on-surface">Kiểm tra trình độ tiếng Anh</h1>
        <p className="text-body-md text-on-surface-variant">Khám phá mức khởi đầu phù hợp trước khi bắt đầu học.</p>
      </div>
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm sm:p-8">
        <PlacementInfoGrid title="Thông tin bài kiểm tra" items={PLACEMENT_INTRO_INFO} />
        <div className="border-t border-outline-variant/60" aria-hidden="true" />
        <PlacementChecklist title="Trước khi bắt đầu" rules={PLACEMENT_INTRO_RULES} />
        <div className="border-t border-outline-variant/60" aria-hidden="true" />
        <PlacementStartCta label="Bắt đầu bài kiểm tra" footnote="Thời gian bắt đầu tính ngay khi bạn vào làm bài." onStart={onStart} starting={starting} error={error} />
      </section>
    </div>
  );
}
