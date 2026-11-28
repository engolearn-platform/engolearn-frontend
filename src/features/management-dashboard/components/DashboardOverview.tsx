import { BookOpenText, Library, Medal, SpellCheck, UsersRound } from "lucide-react";
import { HasRole } from "@features/auth/contract";
import type { DashboardSummary } from "@features/management-dashboard/types/dashboard.types";
import { DashboardStatCard } from "./DashboardStatCard";

const formatCount = (value: number) => value.toLocaleString("vi-VN");

export function DashboardOverview({ summary }: { summary: DashboardSummary }) {
  const content = summary.content;

  return (
    <div className="space-y-8">
      <HasRole allowedRoles={["ADMIN"]}>
        {summary.administration && (
          <section aria-labelledby="administration-stats-heading" className="space-y-4">
            <h2 id="administration-stats-heading" className="text-headline-md font-semibold">
              Quản trị
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardStatCard
                icon={UsersRound}
                label="Tài khoản"
                value={summary.administration.users.total}
                detail="Tài khoản đang hoạt động hoặc bị vô hiệu hóa"
              />
              <DashboardStatCard
                icon={Medal}
                label="Premium đang hiệu lực"
                value={summary.administration.subscription.activePremium}
                detail="Tài khoản Premium trả phí"
              />
            </div>
          </section>
        )}
      </HasRole>

      <section aria-labelledby="content-stats-heading" className="space-y-4">
        <h2 id="content-stats-heading" className="text-headline-md font-semibold">
          Nội dung học
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            icon={BookOpenText}
            label="Chủ đề đã xuất bản"
            value={content.topics.published}
            detail={`${formatCount(content.topics.total)} chủ đề tổng cộng`}
          />
          <DashboardStatCard
            icon={BookOpenText}
            label="Chủ đề bản nháp"
            value={content.topics.draft}
            detail={`${formatCount(content.topics.unpublished)} chưa xuất bản`}
          />
          <DashboardStatCard
            icon={SpellCheck}
            label="Chủ đề ngữ pháp"
            value={content.grammar.total}
            detail={`${formatCount(content.grammar.published)} đã xuất bản · ${formatCount(content.grammar.draft)} bản nháp`}
          />
          <DashboardStatCard
            icon={Library}
            label="Passages hoạt động"
            value={content.passages.active}
            detail={`${formatCount(content.passages.total)} passages tổng cộng`}
          />
        </div>
      </section>
    </div>
  );
}
