import { BookOpenText, Images, LayoutDashboard, Settings, SpellCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@shared/constants";

export interface ManagementNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const MANAGEMENT_CONTENT_NAV_ITEMS: ManagementNavItem[] = [
  { label: "Tổng quan", to: "/admin", icon: LayoutDashboard },
  { label: "Quản lý Chủ đề", to: ROUTES.ADMIN_TOPICS, icon: BookOpenText },
  { label: "Quản lý Ngữ pháp", to: "/admin/grammar", icon: SpellCheck },
  { label: "Thư viện Media", to: "/admin/media", icon: Images },
];

export const MANAGEMENT_SYSTEM_NAV_ITEMS: ManagementNavItem[] = [
  { label: "Cài đặt hệ thống", to: "/admin/settings", icon: Settings },
];
