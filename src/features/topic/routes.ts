import { createElement } from "react";
import { Navigate, useParams } from "react-router";
import { topicDetailPath } from "@features/topic/utils/topic-catalog";
import type { RouteObject } from "react-router";
import ManagementLayout from "@/core/layouts/ManagementLayout";
import LearningLayout from "@/core/layouts/LearningLayout";
import { ROUTES } from "@shared/constants";
import TopicViewerLayout from "@features/topic/components/learning/catalog/TopicViewerLayout";
import TopicPage from "@features/topic/views/TopicPage";
import TopicHomeView from "@features/topic/views/learning/TopicHomeView";
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
import SpeakingDemoView from "@features/topic/views/learning/SpeakingDemoView";
import SpeakingView from "@features/topic/views/learning/SpeakingView";

function LegacyTopicRedirect() {
  const { topicId = "" } = useParams();
  return createElement(Navigate, { to: topicDetailPath(topicId, ROUTES.TOPICS), replace: true });
}

export const TopicCatalogRoutes: RouteObject[] = [
  { path: ROUTES.HOME, Component: TopicHomeView },
  {
    Component: TopicViewerLayout,
    children: [
      { path: ROUTES.TOPICS, Component: TopicPage },
      { path: ROUTES.MY_TOPICS, Component: MyTopicsView },
    ],
  },
];

export const TopicStandaloneRoutes: RouteObject[] = [
  {
    Component: AuthGuard,
    children: [
      { path: ROUTES.SPEAKING_HISTORY, Component: LearningLayout,
        children: [{ index: true, Component: SpeakingView }] },
      ...(import.meta.env.DEV ? [{
        path: ROUTES.SPEAKING_DEMO,
        Component: LearningLayout,
        children: [{ index: true, Component: SpeakingDemoView }],
      }, {
        path: ROUTES.SPEAKING_SESSION_DEV,
        Component: LearningLayout,
        children: [{ index: true, element: createElement(SpeakingView, { devSession: true }) }],
      }] satisfies RouteObject[] : []),
    ],
  },
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
      { path: ROUTES.TOPIC_DETAIL, Component: TopicDetailView },
      { Component: AuthGuard, children: [
        { path: ROUTES.TOPIC_ITEM_SPEAKING, Component: SpeakingView },
        { path: ROUTES.TOPIC_SPEAKING, Component: SpeakingView },
      ] },
    ],
  },
];

export const TopicManagementRoutes: RouteObject[] = [
  {
    Component: AuthGuard,
    children: [{
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
    }],
  },
];
