import {
  BookOpenText,
  Bookmark,
  ChartNoAxesColumn,
  ClipboardList,
  Compass,
  CreditCard,
  GraduationCap,
  Home,
  Mic,
  RotateCcw,
  Search,
  ShoppingBag,
  Target,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@shared/constants";
import { matchPath } from "react-router";

export interface LearningNavLink {
  id: string;
  label: string;
  icon: LucideIcon;
  to?: string;
  patterns?: readonly string[];
  requiresAuth?: boolean;
  disabled?: boolean;
}

export interface LearningNavSubmenu {
  id: string;
  label: string;
  icon: LucideIcon;
  items: readonly LearningNavLink[];
}

export type LearningNavEntry =
  | { kind: "link"; item: LearningNavLink }
  | { kind: "submenu"; submenu: LearningNavSubmenu };

export interface LearningNavSection {
  id: string;
  label: string;
  entries: readonly LearningNavEntry[];
}

const TOPIC_SUBMENU: LearningNavSubmenu = {
  id: "topic-learning",
  label: "Học theo chủ đề",
  icon: Compass,
  items: [
    {
      id: "topics",
      label: "Khám phá chủ đề",
      icon: Compass,
      to: ROUTES.TOPICS,
    },
    {
      id: "my-topics",
      label: "Chủ đề của tôi",
      icon: Bookmark,
      to: ROUTES.MY_TOPICS,
    },
  ],
};

const BENEFITS_SUBMENU: LearningNavSubmenu = {
  id: "account-benefits",
  label: "Tài khoản & quyền lợi",
  icon: CreditCard,
  items: [
    {
      id: "plans",
      label: "Gói học",
      icon: CreditCard,
      to: ROUTES.SUBSCRIPTION,
      patterns: [ROUTES.SUBSCRIPTION, "/subscription/payment-return"],
    },
    {
      id: "usage",
      label: "Hạn mức sử dụng",
      icon: ChartNoAxesColumn,
      to: ROUTES.SUBSCRIPTION_USAGE,
      requiresAuth: true,
    },
    {
      id: "purchases",
      label: "Lịch sử mua hàng",
      icon: ShoppingBag,
      to: ROUTES.SUBSCRIPTION_PURCHASES,
      patterns: [
        ROUTES.SUBSCRIPTION_PURCHASES,
        `${ROUTES.SUBSCRIPTION_PURCHASES}/:reference`,
      ],
      requiresAuth: true,
    },
  ],
};

export const LEARNING_NAV_SECTIONS: readonly LearningNavSection[] = [
  {
    id: "overview",
    label: "Tổng quan",
    entries: [
      {
        kind: "link",
        item: { id: "home", label: "Trang chủ", icon: Home, to: ROUTES.HOME },
      },
    ],
  },
  {
    id: "learning",
    label: "Học tập",
    entries: [
      { kind: "submenu", submenu: TOPIC_SUBMENU },
      {
        kind: "link",
        item: {
          id: "grammar",
          label: "Ngữ pháp",
          icon: BookOpenText,
          to: ROUTES.GRAMMAR,
        },
      },
      {
        kind: "link",
        item: {
          id: "dictionary",
          label: "Tra từ",
          icon: Search,
          disabled: true,
        },
      },
    ],
  },
  {
    id: "practice",
    label: "Luyện tập & đánh giá",
    entries: [
      {
        kind: "link",
        item: {
          id: "learning-paths",
          label: "Luyện tập micro-skill",
          icon: Target,
          to: ROUTES.LEARNING_PATHS,
          patterns: [
            ROUTES.LEARNING_PATHS,
            ROUTES.LEARNING_PATH_DETAIL,
            ROUTES.LEARNING_PATH_DAY_PRACTICE,
            ROUTES.LEARNING_PATH_DAY_RESULT,
          ],
        },
      },
      {
        kind: "link",
        item: {
          id: "speaking-history",
          label: "Lịch sử luyện nói",
          icon: Mic,
          to: ROUTES.SPEAKING_HISTORY,
        },
      },
      {
        kind: "link",
        item: {
          id: "assessment",
          label: "Đánh giá trình độ",
          icon: ClipboardList,
          disabled: true,
        },
      },
      {
        kind: "link",
        item: {
          id: "review",
          label: "Ôn tập",
          icon: RotateCcw,
          disabled: true,
        },
      },
    ],
  },
  {
    id: "account",
    label: "Cá nhân",
    entries: [{ kind: "submenu", submenu: BENEFITS_SUBMENU }],
  },
];

export const PROFILE_NAV_ITEM: LearningNavLink = {
  id: "profile",
  label: "Cá nhân",
  icon: UserRound,
  to: ROUTES.PROFILE,
};

export const BRAND_ICON = GraduationCap;

export interface MatchedLearningRoute {
  section: LearningNavSection;
  submenu?: LearningNavSubmenu;
  item: LearningNavLink;
  specificity: number;
}

function matchesPattern(pattern: string, pathname: string): boolean {
  return matchPath({ path: pattern, end: true }, pathname) !== null;
}

function flattenSection(
  section: LearningNavSection,
): Array<{ item: LearningNavLink; submenu?: LearningNavSubmenu }> {
  return section.entries.flatMap<{
    item: LearningNavLink;
    submenu?: LearningNavSubmenu;
  }>((entry) =>
    entry.kind === "link"
      ? [{ item: entry.item }]
      : entry.submenu.items.map((item) => ({ item, submenu: entry.submenu })),
  );
}

export function matchLearningRoute(
  pathname: string,
): MatchedLearningRoute | null {
  const matches = LEARNING_NAV_SECTIONS.flatMap<MatchedLearningRoute>(
    (section) =>
      flattenSection(section).flatMap<MatchedLearningRoute>(
        ({ item, submenu }) => {
          if (!item.to || item.disabled) return [];
          const patterns = item.patterns ?? [item.to];
          const matchingPattern = patterns.find((pattern) =>
            matchesPattern(pattern, pathname),
          );
          return matchingPattern
            ? [
                {
                  section,
                  ...(submenu ? { submenu } : {}),
                  item,
                  specificity: matchingPattern.split("/").filter(Boolean)
                    .length,
                },
              ]
            : [];
        },
      ),
  );
  return (
    matches.sort((left, right) => right.specificity - left.specificity)[0] ??
    null
  );
}

export function isLearningLinkActive(
  item: LearningNavLink,
  pathname: string,
): boolean {
  if (!item.to || item.disabled) return false;
  return (item.patterns ?? [item.to]).some((pattern) =>
    matchesPattern(pattern, pathname),
  );
}

export function isLearningLinkCurrent(
  item: LearningNavLink,
  pathname: string,
): boolean {
  return Boolean(
    item.to && !item.disabled && matchesPattern(item.to, pathname),
  );
}
