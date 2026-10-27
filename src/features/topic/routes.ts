import { createElement } from "react";
import { Navigate, useParams } from "react-router";
import { topicDetailPath } from "@features/topic/utils/topic-catalog";
import type { RouteObject } from "react-router";
import ManagementLayout from "@/core/layouts/ManagementLayout";
import { ROUTES } from "@shared/constants";
import TopicViewerLayout from "@features/topic/components/learning/catalog/TopicViewerLayout";
import TopicCatalogLayout from "@features/topic/components/learning/catalog/TopicCatalogLayout";
import TopicPage from "@features/topic/views/TopicPage";
import MyTopicsView from "@features/topic/views/learning/MyTopicsView";
import TopicDetailView from "@features/topic/views/learning/TopicDetailView";
import TopicAttemptEntryView from "@features/topic/views/learning/TopicAttemptEntryView";
import TopicManagementListView from "@features/topic/views/management/TopicManagementListView";
import TopicUpsertBasicInfoView from "@features/topic/views/management/TopicUpsertBasicInfoView";
import TopicUpsertItemsView from "@features/topic/views/management/TopicUpsertItemsView";
import TopicItemEditorView from "@features/topic/views/management/TopicItemEditorView";

function LegacyTopicRedirect() {
  const { topicId = "" } = useParams();
  return createElement(Navigate, { to: topicDetailPath(topicId, ROUTES.TOPICS), replace: true });
}

export const TopicRoutes: RouteObject[] = [
  {
    Component: TopicViewerLayout,
    children: [
      { Component: TopicCatalogLayout, children: [
        { path: ROUTES.TOPICS, Component: TopicPage },
        { path: ROUTES.MY_TOPICS, Component: MyTopicsView },
      ] },
      { path: ROUTES.TOPIC_CONTEXT, Component: LegacyTopicRedirect },
      { path: ROUTES.TOPIC_VOCAB, Component: LegacyTopicRedirect },
      { path: ROUTES.TOPIC_EXPRESSIONS, Component: LegacyTopicRedirect },
      { path: ROUTES.TOPIC_PRACTICE, Component: LegacyTopicRedirect },
      { path: ROUTES.TOPIC_DETAIL, Component: TopicDetailView },
      { path: ROUTES.TOPIC_ATTEMPT, Component: TopicAttemptEntryView },
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
