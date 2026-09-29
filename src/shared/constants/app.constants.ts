export const APP_NAME = "Feature-Based React";

export const ROUTES = {
  HOME: "/",
  POSTS: "/posts",
  PRODUCTS: "/products",
  GRAMMAR: "/grammar",
  TOPICS: "/topics",
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
