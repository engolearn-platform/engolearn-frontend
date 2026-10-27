import type { RouteObject } from "react-router";
import ManagementLayout from "@/core/layouts/ManagementLayout";
import TopicLearningLayout from "@/core/layouts/TopicLearningLayout";
import { ROUTES } from "@shared/constants";
import TopicViewerLayout from "@features/topic/components/learning/catalog/TopicViewerLayout";
import TopicCatalogLayout from "@features/topic/components/learning/catalog/TopicCatalogLayout";
import TopicPage from "@features/topic/views/TopicPage";
import MyTopicsView from "@features/topic/views/learning/MyTopicsView";
import TopicDetailView from "@features/topic/views/learning/TopicDetailView";
import TopicAttemptEntryView from "@features/topic/views/learning/TopicAttemptEntryView";
import TopicContextView from "@features/topic/views/learning/TopicContextView";
import TopicVocabView from "@features/topic/views/learning/TopicVocabView";
import TopicExpressionsView from "@features/topic/views/learning/TopicExpressionsView";
import TopicPracticePlaceholderView from "@features/topic/views/learning/TopicPracticePlaceholderView";
import TopicManagementListView from "@features/topic/views/management/TopicManagementListView";
import TopicUpsertBasicInfoView from "@features/topic/views/management/TopicUpsertBasicInfoView";
import TopicUpsertItemsView from "@features/topic/views/management/TopicUpsertItemsView";
import TopicItemEditorView from "@features/topic/views/management/TopicItemEditorView";

export const TopicRoutes: RouteObject[] = [
  {
    Component: TopicViewerLayout,
    children: [
      { Component: TopicCatalogLayout, children: [
        { path: ROUTES.TOPICS, Component: TopicPage },
        { path: ROUTES.MY_TOPICS, Component: MyTopicsView },
      ] },
      { path: ROUTES.TOPIC_DETAIL, Component: TopicDetailView },
      { path: ROUTES.TOPIC_ATTEMPT, Component: TopicAttemptEntryView },
    ],
  },
  {
    Component: TopicLearningLayout,
    children: [
      { path: ROUTES.TOPIC_CONTEXT, Component: TopicContextView },
      { path: ROUTES.TOPIC_VOCAB, Component: TopicVocabView },
      { path: ROUTES.TOPIC_EXPRESSIONS, Component: TopicExpressionsView },
      { path: ROUTES.TOPIC_PRACTICE, Component: TopicPracticePlaceholderView },
    ],
  },
  {
    path: ROUTES.ADMIN_TOPICS,
    Component: ManagementLayout,
    children: [
      { path: "", Component: TopicManagementListView },
      { path: "create", Component: TopicUpsertBasicInfoView },
      { path: "create/items", Component: TopicUpsertItemsView },
      { path: "create/items/:itemId/:sectionKey", Component: TopicItemEditorView },
      { path: ":topicId/edit", Component: TopicUpsertBasicInfoView },
      { path: ":topicId/edit/items", Component: TopicUpsertItemsView },
      { path: ":topicId/edit/items/:itemId/:sectionKey", Component: TopicItemEditorView },
    ],
  },
];
