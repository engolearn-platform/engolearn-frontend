import { BookOpenText, Images, LayoutDashboard, Settings, SpellCheck, ClipboardList, Library, ListChecks } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@shared/constants";

export interface ManagementNavItem {
  label: string;
  to: string;
  end?: boolean;
  icon: LucideIcon;
}

export const MANAGEMENT_CONTENT_NAV_ITEMS: ManagementNavItem[] = [
  { label: "Tổng quan", to: "/admin", end: true, icon: LayoutDashboard },
  { label: "Đề đánh giá", to: ROUTES.ADMIN_ASSESSMENT, icon: BookOpenText },
  { label: "Quản lý Chủ đề", to: ROUTES.ADMIN_TOPICS, icon: BookOpenText },
  { label: "Quản lý Passages", to: ROUTES.ADMIN_PASSAGES, icon: Library },
  { label: "Câu hỏi Learning Path", to: ROUTES.ADMIN_LEARNING_PATH_QUESTIONS, icon: ListChecks },
  { label: "Quản lý Ngữ pháp", to: ROUTES.ADMIN_GRAMMAR, icon: SpellCheck },
  { label: "Thư viện Media", to: "/admin/media", icon: Images },
];

export const MANAGEMENT_SYSTEM_NAV_ITEMS: ManagementNavItem[] = [
  { label: "Gói học & quyền lợi", to: ROUTES.ADMIN_SUBSCRIPTION_PLANS, icon: BookOpenText },
  { label: "Cấu hình hạn mức", to: ROUTES.ADMIN_SUBSCRIPTION_QUOTAS, icon: Settings },
  { label: "Cài đặt hệ thống", to: "/admin/settings", icon: Settings },
];

// Placement owns the route implementation; shell navigation only links to its management surface.
export const MANAGEMENT_PLACEMENT_NAV_ITEMS: ManagementNavItem[] = [
  { label: "Bộ đề", to: "/admin/placement/test-sets", icon: ClipboardList },
  { label: "Ngân hàng câu hỏi", to: "/admin/placement/questions", icon: Library },
  { label: "Kết quả", to: "/admin/placement/attempts", icon: ListChecks },
];
