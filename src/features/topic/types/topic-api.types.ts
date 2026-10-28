// Generated from docs/handout/topic-learning/api.openapi.yaml.
// Run npm run topic:types after editing the contract.

export type CefrLevelDto = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type LearningStatusDto = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export type LearningStageDto = "CONTEXT" | "VOCAB" | "EXPRESSIONS" | "FILL_BLANK" | "SITUATIONAL_CHOICE";

export type ContentStageDto = "CONTEXT" | "VOCAB" | "EXPRESSIONS";

export type BlockReasonDto = "SIGN_IN_REQUIRED" | "LEVEL_TOO_LOW" | "PREDECESSOR_INCOMPLETE" | "OTHER_ITEM_IN_PROGRESS" | "ALREADY_COMPLETED" | "NOT_COMPLETED" | "NO_RUNNING_ATTEMPT" | "CONTENT_UNAVAILABLE";

export type ViewerDto = {
  "kind": "GUEST" | "LEARNER";
  "learnerId": string | null;
  "displayName": string | null;
  "cefrLevel": CefrLevelDto | null;
};

export type ActionAvailabilityDto = {
  "allowed": boolean;
  "reason": BlockReasonDto | null;
};

export type ItemActionsDto = {
  "start": ActionAvailabilityDto;
  "continue": ActionAvailabilityDto;
  "review": ActionAvailabilityDto;
  "retry": ActionAvailabilityDto;
  "resumeRetry": ActionAvailabilityDto;
  "restartRetry": ActionAvailabilityDto;
};

export type PositionDto = {
  "stage": LearningStageDto;
  "itemIndex": number;
};

export type TopicProgressSummaryDto = {
  "status": LearningStatusDto;
  "completedItemCount": number;
  "totalItemCount": number;
  "percent": number;
};

export type LearningMetricsDto = {
  "learnedVocabularyCount": number;
  "totalVocabularyCount": number;
  "learnedExpressionCount": number;
  "totalExpressionCount": number;
  "completedQuizCount": number;
  "totalQuizCount": number;
};

export type AttemptProgressDto = {
  "completedStepCount": number;
  "totalStepCount": number;
  "percent": number;
  "learnedVocabularyCount": number;
  "learnedExpressionCount": number;
  "completedQuizCount": number;
  "totalQuizCount": number;
};

export type AttemptDto = {
  "attemptId": string;
  "topicId": string;
  "topicItemId": string;
  "topicItemVersionId": string;
  "version": number;
  "mode": "LEARN" | "RETRY";
  "status": "IN_PROGRESS" | "COMPLETED";
  "revision": number;
  "position": PositionDto | null;
  "progress": AttemptProgressDto;
  "retrySessionId": string | null;
  "startedAt": string;
  "lastAccessedAt": string;
  "completedAt": string | null;
};

export type AttemptReferenceDto = {
  "attemptId": string;
  "position": PositionDto;
};

export type RetrySessionDto = {
  "retrySessionId": string;
  "topicId": string;
  "scope": "ITEM" | "TOPIC";
  "status": "IN_PROGRESS" | "COMPLETED";
  "itemIds": Array<string>;
  "currentAttemptId": string | null;
  "startedAt": string;
  "completedAt": string | null;
  "completedItemIds": Array<string>;
  "itemsSnapshot": Array<RetryItemSnapshotDto>;
  "nextTopicItemId": string | null;
};

export type TopicCardDto = {
  "topicId": string;
  "coverUrl": string | null;
  "titleEn": string;
  "titleVi": string;
  "cefrLevel": CefrLevelDto;
  "vocabularyCount": number;
  "quizCount": number;
  "durationMinutes": number;
  "totalItemCount": number;
  "progress": TopicProgressSummaryDto | null;
  "hasNewContent": boolean;
  "startAvailability": ActionAvailabilityDto;
  "lastAccessedAt": string | null;
};

export type TopicPageDto = {
  "items": Array<TopicCardDto>;
  "total": number;
  "nextCursor": string | null;
  "hasMore": boolean;
};

export type MyTopicCountsDto = {
  "inProgress": number;
  "completed": number;
};

export type MyTopicPageDto = {
  "items": Array<TopicCardDto>;
  "total": number;
  "counts": MyTopicCountsDto;
  "nextCursor": string | null;
  "hasMore": boolean;
};

export type TopicItemSummaryDto = {
  "topicItemId": string;
  "title": string;
  "description": string;
  "durationMinutes": number;
  "vocabularyCount": number;
  "expressionCount": number;
  "quizCount": number;
  "learningStatus": LearningStatusDto | null;
  "hasNewContent": boolean;
  "actions": ItemActionsDto;
  "learningAttempt": AttemptReferenceDto | null;
  "retryAttempt": AttemptReferenceDto | null;
  "completedAttemptId": string | null;
};

export type TopicDetailDto = {
  "topicId": string;
  "coverUrl": string | null;
  "titleEn": string;
  "titleVi": string;
  "cefrLevel": CefrLevelDto;
  "description": string;
  "durationMinutes": number;
  "vocabularyCount": number;
  "expressionCount": number;
  "quizCount": number;
  "hasNewContent": boolean;
  "progress": TopicProgressSummaryDto | null;
  "items": Array<TopicItemSummaryDto>;
  "retrySession": RetrySessionDto | null;
  "retryAvailability": ActionAvailabilityDto;
};

export type TopicItemProgressDto = {
  "topicItemId": string;
  "status": LearningStatusDto;
  "firstTryCorrectCount": number | null;
  "totalQuizCount": number | null;
  "completedAt": string | null;
};

export type TopicProgressDto = {
  "topicId": string;
  "status": LearningStatusDto;
  "completedItemCount": number;
  "totalItemCount": number;
  "percent": number;
  "lastAccessedAt": string | null;
  "metrics": LearningMetricsDto;
  "hasNewContent": boolean;
  "items": Array<TopicItemProgressDto>;
};

export type DialogueLineDto = {
  "speaker": string;
  "textEn": string;
  "textVi": string;
  "audioUrl": string | null;
};

export type ContextContentDto = {
  "scenarioDescription": string;
  "imageUrl": string | null;
  "promptingQuestion": string | null;
  "dialogue": Array<DialogueLineDto>;
  "dialogueAudioUrl": string | null;
  "durationSec": number | null;
  "tips": string | null;
};

export type WordExampleDto = {
  "exampleId": string;
  "textEn": string;
  "textVi": string;
  "audioUrl": string | null;
};

export type CollocationDto = {
  "textEn": string;
  "meaningVi": string;
};

export type QuickCheckDto = {
  "question": string;
  "options": Array<string>;
  "correctAnswer": string;
};

export type VocabularyDto = {
  "vocabId": string;
  "senseId": string;
  "word": string;
  "pronunciation": string | null;
  "meaningVi": string;
  "partOfSpeech": string | null;
  "label": string | null;
  "usageDescription": string | null;
  "imageUrl": string | null;
  "audioUrl": string | null;
  "audioEn": string | null;
  "audioUs": string | null;
  "examples": Array<WordExampleDto>;
  "collocations": Array<CollocationDto>;
  "quickCheck": QuickCheckDto | null;
  "orderIndex": number;
  "tips": string | null;
};

export type ExpressionExampleDto = {
  "expressionId": string;
  "type": "BASIC_SUGGESTION" | "POLITE_INQUIRY" | "SLOT_PATTERN";
  "textEn": string;
  "textVi": string;
  "usageNote": string;
  "audioUrl": string | null;
};

export type ExpressionPurposeDto = {
  "purposeId": string;
  "purposeEn": string | null;
  "purposeVi": string;
  "orderIndex": number;
  "examples": Array<ExpressionExampleDto>;
};

export type ExpressionGroupDto = {
  "groupId": string;
  "purposes": Array<ExpressionPurposeDto>;
  "tips": string | null;
};

export type LessonContentDto = {
  "topicItemId": string;
  "topicItemVersionId": string;
  "version": number;
  "title": string;
  "description": string;
  "context": ContextContentDto;
  "vocabularies": Array<VocabularyDto>;
  "expressions": Array<ExpressionGroupDto>;
};

export type QuizOptionDto = {
  "optionId": string;
  "text": string;
};

export type FillBlankQuizDto = {
  "quizId": string;
  "title": string;
  "index": number;
  "totalInType": number;
  "situationVi": string | null;
  "imageUrl": string | null;
  "tips": string | null;
  "promptAudioUrl": string | null;
  "type": "FILL_BLANK";
  "sentenceBefore": string;
  "sentenceAfter": string;
  "options": Array<QuizOptionDto>;
};

export type SituationalChoiceQuizDto = {
  "quizId": string;
  "title": string;
  "index": number;
  "totalInType": number;
  "situationVi": string | null;
  "imageUrl": string | null;
  "tips": string | null;
  "promptAudioUrl": string | null;
  "type": "SITUATIONAL_CHOICE";
  "questionVi": string;
  "options": Array<QuizOptionDto>;
};

export type QuizDto = FillBlankQuizDto | SituationalChoiceQuizDto;

export type CurrentQuizDto = {
  "attempt": AttemptDto;
  "quiz": QuizDto | null;
};

export type QuizFeedbackDto = {
  "correctOptionId": string;
  "completedSentenceEn": string | null;
  "translationVi": string | null;
  "explanationVi": string;
  "grammarNoteVi": string | null;
  "audioUrl": string | null;
};

export type QuizAnswerDto = {
  "quizId": string;
  "isCorrect": boolean;
  "feedback": QuizFeedbackDto | null;
  "attempt": AttemptDto;
};

export type ReviewedQuizDto = {
  "quiz": QuizDto;
  "feedback": QuizFeedbackDto;
  "firstTryCorrect": boolean;
};

export type ItemReviewDto = {
  "attempt": AttemptDto;
  "content": LessonContentDto;
  "quizzes": Array<ReviewedQuizDto>;
};

export type ItemResultDto = {
  "attemptId": string;
  "topicId": string;
  "topicItemId": string;
  "title": string;
  "firstTryCorrectCount": number;
  "totalQuizCount": number;
  "accuracyPercent": number;
  "completedAt": string;
  "nextTopicItemId": string | null;
  "nextItemAvailability": ActionAvailabilityDto;
  "retrySession": RetrySessionDto | null;
};

export type TopicResultItemDto = {
  "topicItemId": string;
  "title": string;
  "completedAttemptId": string;
  "firstTryCorrectCount": number;
  "totalQuizCount": number;
  "accuracyPercent": number;
  "hasNewContent": boolean;
  "actions": ItemActionsDto;
};

export type TopicResultDto = {
  "topicId": string;
  "titleVi": string;
  "firstTryCorrectCount": number;
  "totalQuizCount": number;
  "accuracyPercent": number;
  "items": Array<TopicResultItemDto>;
  "retryAvailability": ActionAvailabilityDto;
};

export type StartAttemptRequestDto = {
  "mode": "LEARN" | "RETRY";
  "replaceRetrySessionId": string | null;
  "retrySessionId": string | null;
};

export type AdvanceContentRequestDto = {
  "revision": number;
  "stage": ContentStageDto;
  "itemIndex": number;
};

export type AnswerQuizRequestDto = {
  "revision": number;
  "optionId": string;
};

export type StartTopicRetryRequestDto = {
  "replaceRetrySessionId": string | null;
};

export type ProblemDto = {
  "type": string;
  "title": string;
  "status": number;
  "detail": string;
  "code": string;
};

export type AccessReceiptDto = {
  "lastAccessedAt": string;
};

export type CompleteAttemptRequestDto = {
  "revision": number;
};

export type RetryItemSnapshotDto = {
  "topicItemId": string;
  "topicItemVersionId": string;
  "orderIndex": number;
};
