import { BookOpenText, Images, LayoutDashboard, Settings, SpellCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@shared/constants";

export interface AdminNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const ADMIN_CONTENT_NAV_ITEMS: AdminNavItem[] = [
  { label: "Tổng quan", to: "/admin", icon: LayoutDashboard },
  { label: "Quản lý Chủ đề", to: ROUTES.ADMIN_TOPICS, icon: BookOpenText },
  { label: "Quản lý Ngữ pháp", to: "/admin/grammar", icon: SpellCheck },
  { label: "Thư viện Media", to: "/admin/media", icon: Images },
];

export const ADMIN_SYSTEM_NAV_ITEMS: AdminNavItem[] = [
  { label: "Cài đặt hệ thống", to: "/admin/settings", icon: Settings },
];
