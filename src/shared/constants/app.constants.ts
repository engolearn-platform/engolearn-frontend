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
  ADMIN_TOPICS: "/admin/topics",
} as const;
