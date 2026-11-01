# Periodic assessment learner F01/F02

Stitch reference: https://stitch.withgoogle.com/projects/4463842687290353615

Routes: /assessment (preparation), /assessment/taking (focused exam), /assessment/history,
/assessment/attempts/:attemptId/result and /assessment/attempts/:attemptId/review.
Register only these learner routes. Preparation/results/history reuse LearningLayout; taking
uses a focused header. Feature components, hooks, types and API client stay inside assessment.

States: preparation eligibility and active conflict; reading preview/answer; listening lead/answer;
saving/saved/error; explicit submit/abandon confirmation; terminal READY/NO_RESULT/ABANDONED;
history loading/empty/error; Free 2/5 skills or entitled 5/5; read-only review with answer/transcript.

API is real, not a mocked assessment service. Dev-only upstream fixtures are labeled. A document
binding lives only in memory: navigation/reload cannot resume. Four progress states and contextual
server time are consistent on desktop/mobile. Official audio has no seeking/replay/rate controls.
Review audio can replay. Do not persist hidden analysis or official taking data in localStorage.

Learner-approved timing update (2026-11-01): reading previews at questions 11, 16,
21 and 26 offer “Bắt đầu trả lời ngay”. The action calls the binding-protected real
POST /attempts/{id}/finish-stage with unitIndex 10..13, phase READING_PREVIEW and a
retry-stable commandId. The server starts the usual shared 300s answer window without
carrying unused preview time. Listening lead has no manual skip button. Finishing
question 45 advances immediately to 46 and unmounts the old audio. “Hoàn thành bài”
on question 50 opens submission confirmation; cancel keeps the question, confirm
saves the final choice and grades immediately through final Next. There is no completed-group
waiting screen. Commands share the serialized mutation queue with autosave.
Review explicitly shows the selected letter/outcome and the correct letter. A selected
wrong option uses the existing error token with a text label; correct and blank states remain distinct.

Validation: npm run build, npm run lint, real FE proxy against BE, desktop/mobile keyboard and
screen-reader labels, race/deadline/quota/ownership/audio/refund scenarios in the delivery checklist.

Current main integration: routes use AssessmentLearningLayout, composing the existing
LearningLayout with optional header/profile inputs while preserving other features' defaults.
No hardcoded learner name, level or streak is displayed in the assessment shell. Types use
assessment.types.ts; query results are tagged by account, auth generation and resource callback
so changing attempts/pages does not display an old result while loading. Official audio
failure observations use /audio-failure; these never change server deadlines or quota.
The component reuses the same issue ID for a failed media transport retry.

Premium is two starts/month in the approved separate demo policy; FE renders the provider's
actual quota rather than hardcoding a plan limit. Main contains Subscription/Quota; the
unmerged Payment branch and real authentication/baseline integrations are still release
boundaries. No fake production auth or assessment API is introduced. The backend technical
assessment document records the current production limitations and required handoffs.
