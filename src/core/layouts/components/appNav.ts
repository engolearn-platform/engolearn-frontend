import {
  BookOpenText,
  Home,
  LayoutGrid,
  RotateCcw,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@shared/constants";

export interface AppNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  { label: "Trang chủ", to: ROUTES.HOME, icon: Home },
  { label: "Chủ đề", to: "/topics", icon: LayoutGrid },
  { label: "Ngữ pháp", to: ROUTES.GRAMMAR, icon: BookOpenText },
  { label: "Ôn tập", to: "/review", icon: RotateCcw },
];

export const PROFILE_NAV_ITEM: AppNavItem = {
  label: "Cá nhân",
  to: "/profile",
  icon: User,
};
