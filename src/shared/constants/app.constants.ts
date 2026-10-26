export const APP_NAME = "Feature-Based React";

export const ROUTES = {
  HOME: "/",
  POSTS: "/posts",
  PRODUCTS: "/products",
  GRAMMAR: "/grammar",
  LEARNING_PATHS: "/learning-paths",
  LEARNING_PATH_DETAIL: "/learning-paths/:pathId",
  TOPICS: "/topics",
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
  ADMIN_TOPIC_CREATE: "/admin/topics/create",
  ADMIN_TOPIC_CREATE_ITEMS: "/admin/topics/create/items",
  ADMIN_TOPIC_ITEM_SECTION: "/admin/topics/create/items/:itemId/:sectionKey",
  ADMIN_TOPIC_EDIT: "/admin/topics/:topicId/edit",
  ADMIN_TOPIC_EDIT_ITEMS: "/admin/topics/:topicId/edit/items",
  ADMIN_TOPIC_EDIT_ITEM_SECTION:
    "/admin/topics/:topicId/edit/items/:itemId/:sectionKey",
} as const;

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
