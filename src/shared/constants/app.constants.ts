export const APP_NAME = "Feature-Based React";

export const ROUTES = {
  HOME: "/",
  SUBSCRIPTION: "/subscription",
  SUBSCRIPTION_USAGE: "/subscription/usage",
  POSTS: "/posts",
  PRODUCTS: "/products",
  GRAMMAR: "/grammar",
  LEARNING_PATHS: "/learning-paths",
  LEARNING_PATH_DETAIL: "/learning-paths/:pathId",
  LEARNING_PATH_DAY_PRACTICE: "/learning-paths/:pathId/weeks/:weekNo/days/:dayNo/practice",
  LEARNING_PATH_DAY_RESULT: "/learning-paths/:pathId/weeks/:weekNo/days/:dayNo/result",
  TOPICS: "/topics",
  MY_TOPICS: "/my-topics",
  TOPIC_ATTEMPT: "/topics/:topicId/attempts/:attemptId",
  TOPIC_ITEM_RESULT: "/topics/:topicId/attempts/:attemptId/result",
  TOPIC_RESULT: "/topics/:topicId/result",
  TOPIC_DETAIL: "/topics/:topicId",
  // TEMP URL for testing the Topic Item context screen — final URL TBD,
  // see docs/handout/topic-item-context-url-note.md.
  TOPIC_CONTEXT: "/topics/:topicId/context",
  TOPIC_VOCAB: "/topics/:topicId/vocab/:vocabId",
  TOPIC_EXPRESSIONS: "/topics/:topicId/expressions",
  // Practice (EXERCISES) screen has no Stitch UI yet — path reserved so
  // sidebar/footer navigation lands on a placeholder instead of blank.
  TOPIC_PRACTICE: "/topics/:topicId/practice",
  ADMIN_TOPICS: "/admin/topics",
  ADMIN_SUBSCRIPTION_PLANS: "/admin/subscription/plans",
  ADMIN_SUBSCRIPTION_QUOTAS: "/admin/subscription/quotas",
  ADMIN_TOPIC_CREATE: "/admin/topics/create",
  ADMIN_TOPIC_CREATE_ITEMS: "/admin/topics/create/items",
  ADMIN_TOPIC_ITEM_SECTION: "/admin/topics/create/items/:itemId/:sectionKey",
  ADMIN_TOPIC_EDIT: "/admin/topics/:topicId/edit",
  ADMIN_TOPIC_EDIT_ITEMS: "/admin/topics/:topicId/edit/items",
  ADMIN_TOPIC_EDIT_ITEM_SECTION:
    "/admin/topics/:topicId/edit/items/:itemId/:sectionKey",
} as const;

export function learningPathDayPath(
  pathId: string,
  weekNo: number,
  dayNo: number,
  screen: "practice" | "result",
): string {
  const template = screen === "practice"
    ? ROUTES.LEARNING_PATH_DAY_PRACTICE
    : ROUTES.LEARNING_PATH_DAY_RESULT;

  return template
    .replace(":pathId", encodeURIComponent(pathId))
    .replace(":weekNo", String(weekNo))
    .replace(":dayNo", String(dayNo));
}

export function adminTopicBasicInfoPath(topicId?: string): string {
  return topicId
    ? ROUTES.ADMIN_TOPIC_EDIT.replace(":topicId", topicId)
    : ROUTES.ADMIN_TOPIC_CREATE;
}

export function adminTopicItemsPath(topicId?: string): string {
  return topicId
    ? ROUTES.ADMIN_TOPIC_EDIT_ITEMS.replace(":topicId", topicId)
    : ROUTES.ADMIN_TOPIC_CREATE_ITEMS;
}

export function topicItemSectionPath(
  itemId: string,
  section: string,
  topicId?: string,
): string {
  const template = topicId
    ? ROUTES.ADMIN_TOPIC_EDIT_ITEM_SECTION
    : ROUTES.ADMIN_TOPIC_ITEM_SECTION;
  return template
    .replace(":topicId", topicId ?? "")
    .replace(":itemId", itemId)
    .replace(":sectionKey", section);
}
