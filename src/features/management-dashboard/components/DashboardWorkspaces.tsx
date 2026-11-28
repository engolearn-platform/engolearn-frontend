import { BookOpenText, ClipboardList, Library, ListChecks, Settings, SpellCheck, UsersRound } from "lucide-react";
import { HasRole } from "@features/auth/contract";
import { ROUTES } from "@shared/constants";
import type { DashboardSummary } from "@features/management-dashboard/types/dashboard.types";
import { DashboardWorkspaceCard } from "./DashboardWorkspaceCard";

const formatCount = (value: number) => value.toLocaleString("vi-VN");

export function DashboardWorkspaces({ summary }: { summary?: DashboardSummary }) {
  const content = summary?.content;
  const administration = summary?.administration;

  return (
    <div className="space-y-8">
      <section aria-labelledby="content-workspaces-heading" className="space-y-4">
        <h2 id="content-workspaces-heading" className="text-headline-md font-semibold">
          Không gian nội dung
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <DashboardWorkspaceCard
            icon={BookOpenText}
            title="Quản lý Chủ đề"
            description={content
              ? `${formatCount(content.topics.draft)} bản nháp · ${formatCount(content.topics.published)} đã xuất bản`
              : "Quản lý nội dung chủ đề"}
            to={ROUTES.ADMIN_TOPICS}
          />
          <DashboardWorkspaceCard
            icon={SpellCheck}
            title="Quản lý Ngữ pháp"
            description={content
              ? `${formatCount(content.grammar.draft)} bản nháp · ${formatCount(content.grammar.published)} đã xuất bản`
              : "Quản lý nội dung ngữ pháp"}
            to={ROUTES.ADMIN_GRAMMAR}
          />
          <DashboardWorkspaceCard
            icon={Library}
            title="Quản lý Passages"
            description={content
              ? `${formatCount(content.passages.draft)} bản nháp · ${formatCount(content.passages.active)} đang hoạt động`
              : "Quản lý passages học tập"}
            to={ROUTES.ADMIN_PASSAGES}
          />
          <DashboardWorkspaceCard
            icon={ListChecks}
            title="Câu hỏi Learning Path"
            description={content
              ? `${formatCount(content.learningPathQuestions.total)} câu hỏi`
              : "Quản lý ngân hàng câu hỏi"}
            to={ROUTES.ADMIN_LEARNING_PATH_QUESTIONS}
          />
        </div>
      </section>

      <HasRole allowedRoles={["ADMIN"]}>
        <section aria-labelledby="admin-workspaces-heading" className="space-y-4">
          <h2 id="admin-workspaces-heading" className="text-headline-md font-semibold">
            Không gian quản trị
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <DashboardWorkspaceCard
              icon={UsersRound}
              title="Quản lý người dùng"
              description={administration
                ? `${formatCount(administration.users.total)} tài khoản`
                : "Quản lý tài khoản"}
              to="/admin/users"
            />
            <DashboardWorkspaceCard
              icon={ClipboardList}
              title="Placement Test"
              description={administration
                ? `${formatCount(administration.placement.testSets)} bộ đề · ${formatCount(administration.placement.questions)} câu hỏi`
                : "Quản lý bộ đề và câu hỏi"}
              to="/admin/placement/test-sets"
            />
            <DashboardWorkspaceCard
              icon={Settings}
              title="Gói học & quyền lợi"
              description="Quản lý gói đăng ký"
              to={ROUTES.ADMIN_SUBSCRIPTION_PLANS}
            />
            <DashboardWorkspaceCard
              icon={Settings}
              title="Cấu hình hạn mức"
              description="Quản lý hạn mức sử dụng"
              to={ROUTES.ADMIN_SUBSCRIPTION_QUOTAS}
            />
          </div>
        </section>
      </HasRole>
    </div>
  );
}
