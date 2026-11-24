import { BookOpenText, Images, LayoutDashboard, Settings, SpellCheck } from "lucide-react";
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
  { label: "Quản lý Ngữ pháp", to: ROUTES.ADMIN_GRAMMAR, icon: SpellCheck },
  { label: "Thư viện Media", to: "/admin/media", icon: Images },
];

export const MANAGEMENT_SYSTEM_NAV_ITEMS: ManagementNavItem[] = [
  { label: "Gói học & quyền lợi", to: ROUTES.ADMIN_SUBSCRIPTION_PLANS, icon: BookOpenText },
  { label: "Cấu hình hạn mức", to: ROUTES.ADMIN_SUBSCRIPTION_QUOTAS, icon: Settings },
  { label: "Cài đặt hệ thống", to: "/admin/settings", icon: Settings },
];
