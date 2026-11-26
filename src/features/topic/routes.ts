import { createElement } from "react";
import { Navigate, useParams } from "react-router";
import { topicDetailPath } from "@features/topic/utils/topic-catalog";
import type { RouteObject } from "react-router";
import ManagementLayout from "@/core/layouts/ManagementLayout";
import { ROUTES } from "@shared/constants";
import TopicViewerLayout from "@features/topic/components/learning/catalog/TopicViewerLayout";
import TopicPage from "@features/topic/views/TopicPage";
import MyTopicsView from "@features/topic/views/learning/MyTopicsView";
import TopicDetailView from "@features/topic/views/learning/TopicDetailView";
import TopicAttemptEntryView from "@features/topic/views/learning/TopicAttemptEntryView";
import TopicItemResultView from "@features/topic/views/learning/TopicItemResultView";
import TopicResultView from "@features/topic/views/learning/TopicResultView";
import TopicManagementListView from "@features/topic/views/management/TopicManagementListView";
import TopicUpsertBasicInfoView from "@features/topic/views/management/TopicUpsertBasicInfoView";
import TopicUpsertItemsView from "@features/topic/views/management/TopicUpsertItemsView";
import TopicItemEditorView from "@features/topic/views/management/TopicItemEditorView";
import AuthGuard from "@features/auth/components/AuthGuard";
import TopicManagementGuard from "@features/auth/components/TopicManagementGuard";
import TopicManagementReadView from "@features/topic/views/management/TopicManagementReadView";
import TopicManagementReadListView from "@features/topic/views/management/TopicManagementReadListView";
import { TopicSpeakingEntry, ItemSpeakingEntry } from "@features/speaking/contract";
import TopicSpeakingProfileView from "@features/topic/views/management/TopicSpeakingProfileView";
import { ProtectedRoute } from "@features/auth/contract";

function LegacyTopicRedirect() {
  const { topicId = "" } = useParams();
  return createElement(Navigate, { to: topicDetailPath(topicId, ROUTES.TOPICS), replace: true });
}

function TopicSpeakingProfileGuard() {
  return createElement(ProtectedRoute, { allowedRoles: ["CONTENT_MANAGER"] });
}

export const TopicCatalogRoutes: RouteObject[] = [
  {
    Component: TopicViewerLayout,
    children: [{ path: ROUTES.TOPICS, Component: TopicPage }],
  },
];

export const MyTopicsRoutes: RouteObject[] = [
  {
    Component: TopicViewerLayout,
    children: [{ path: ROUTES.MY_TOPICS, Component: MyTopicsView }],
  },
];

export const TopicDetailRoutes: RouteObject[] = [
  {
    Component: TopicViewerLayout,
    children: [{ path: ROUTES.TOPIC_DETAIL, Component: TopicDetailView }],
  },
];

export const TopicStandaloneRoutes: RouteObject[] = [
  {
    Component: TopicViewerLayout,
    children: [
      { path: ROUTES.TOPIC_CONTEXT, Component: LegacyTopicRedirect },
      { path: ROUTES.TOPIC_VOCAB, Component: LegacyTopicRedirect },
      { path: ROUTES.TOPIC_EXPRESSIONS, Component: LegacyTopicRedirect },
      { path: ROUTES.TOPIC_PRACTICE, Component: LegacyTopicRedirect },
      { path: ROUTES.TOPIC_RESULT, Component: TopicResultView },
      { path: ROUTES.TOPIC_ITEM_RESULT, Component: TopicItemResultView },
      { path: ROUTES.TOPIC_ATTEMPT, Component: TopicAttemptEntryView },
      { Component: AuthGuard, children: [
        { path: ROUTES.TOPIC_ITEM_SPEAKING, Component: ItemSpeakingEntry },
        { path: ROUTES.TOPIC_SPEAKING, Component: TopicSpeakingEntry },
      ] },
    ],
  },
];

export const TopicManagementRoutes: RouteObject[] = [
  {
    Component: TopicManagementGuard,
    children: [{
    path: ROUTES.ADMIN_TOPICS,
    Component: ManagementLayout,
    children: [
      { path: "", Component: TopicManagementListView },
      { path: "read", Component: TopicManagementReadListView },
      { path: ":topicId/view", Component: TopicManagementReadView },
      { path: ":topicId/view/items", Component: TopicManagementReadView },
      { path: ":topicId/view/items/:itemId/:sectionKey", Component: TopicManagementReadView },
      { path: "create", Component: TopicUpsertBasicInfoView },
      { path: "create/items", Component: TopicUpsertItemsView },
      { path: "create/items/:itemId/:sectionKey", Component: TopicItemEditorView },
      { path: ":topicId/edit", Component: TopicUpsertBasicInfoView },
      { path: ":topicId/edit/items", Component: TopicUpsertItemsView },
      { path: ":topicId/edit/items/:itemId/:sectionKey", Component: TopicItemEditorView },
      { Component: TopicSpeakingProfileGuard, children: [
        { path: ":topicId/speaking-profile", Component: TopicSpeakingProfileView },
        { path: ":topicId/items/:itemId/speaking-profile", Component: TopicSpeakingProfileView },
      ] },
    ],
    }],
  },
];
