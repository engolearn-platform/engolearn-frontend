import type { RouteObject } from "react-router";
import LearningLayout from "@/core/layouts/LearningLayout";
import { ProtectedRoute } from "@features/auth/contract";
import { ROUTES } from "@shared/constants";
import SpeakingSessionView from "@features/speaking/views/SpeakingSessionView";
import SpeakingResultView from "@features/speaking/views/SpeakingResultView";
import SpeakingHistoryView from "@features/speaking/views/SpeakingHistoryView";

export const SpeakingRoutes: RouteObject[] = [{
  Component: ProtectedRoute,
  children: [{ Component: LearningLayout, children: [
    { path: ROUTES.SPEAKING_SESSION, Component: SpeakingSessionView },
    { path: ROUTES.SPEAKING_RESULT, Component: SpeakingResultView },
    { path: ROUTES.SPEAKING_HISTORY, Component: SpeakingHistoryView },
  ] }],
}];
