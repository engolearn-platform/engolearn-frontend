import {
  BookOpenText,
  Bookmark,
  Compass,
  ClipboardList,
  GraduationCap,
  Home,
  RotateCcw,
  Search,
  Target,
  User,
  CreditCard,
  ChartNoAxesColumn,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@shared/constants";

export interface LearningNavItem {
  label: string;
  to?: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export const LEARNING_NAV_ITEMS: LearningNavItem[] = [
  { label: "Trang chủ", to: ROUTES.HOME, icon: Home },
  { label: "Khám phá chủ đề", to: ROUTES.TOPICS, icon: Compass },
  { label: "Chủ đề của tôi", to: ROUTES.MY_TOPICS, icon: Bookmark },
  { label: "Ngữ pháp", to: ROUTES.GRAMMAR, icon: BookOpenText },
  { label: "Gói học & quyền lợi", to: ROUTES.SUBSCRIPTION, icon: CreditCard },
  { label: "Hạn mức sử dụng", to: ROUTES.SUBSCRIPTION_USAGE, icon: ChartNoAxesColumn },
  { label: "Ôn tập", to: "/review", icon: RotateCcw },
  { label: "Tra từ", icon: Search, disabled: true },
  { label: "Kiểm tra", icon: ClipboardList, disabled: true },
  {
    label: "Luyện tập micro-skill",
    to: ROUTES.LEARNING_PATHS,
    icon: Target,
  },
];

export const PROFILE_NAV_ITEM: LearningNavItem = {
  label: "Cá nhân",
  to: "/profile",
  icon: User,
};

export const BRAND_ICON = GraduationCap;
