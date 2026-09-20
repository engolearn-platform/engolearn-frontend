import {
  BookOpenText,
  Home,
  LayoutGrid,
  RotateCcw,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@shared/constants";

export interface LearningNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const LEARNING_NAV_ITEMS: LearningNavItem[] = [
  { label: "Trang chủ", to: ROUTES.HOME, icon: Home },
  { label: "Chủ đề", to: ROUTES.TOPICS, icon: LayoutGrid },
  { label: "Ngữ pháp", to: ROUTES.GRAMMAR, icon: BookOpenText },
  { label: "Ôn tập", to: "/review", icon: RotateCcw },
];

export const PROFILE_NAV_ITEM: LearningNavItem = {
  label: "Cá nhân",
  to: "/profile",
  icon: User,
};
