export const APP_NAME = "Feature-Based React";

export const ROUTES = {
  HOME: "/",
  POSTS: "/posts",
  PRODUCTS: "/products",
  GRAMMAR: "/grammar",
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
} as const;

export function topicItemSectionPath(itemId: string, section: string): string {
  return ROUTES.ADMIN_TOPIC_ITEM_SECTION.replace(":itemId", itemId).replace(
    ":sectionKey",
    section,
  );
}
