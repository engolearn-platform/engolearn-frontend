export interface CountSummary { total: number }

export interface DashboardSummary {
  content: {
    topics: { total: number; published: number; draft: number; unpublished: number };
    grammar: { total: number; published: number; draft: number; inProgress: number; archived: number };
    passages: { total: number; active: number; draft: number; retired: number };
    learningPathQuestions: CountSummary;
  };
  administration?: {
    users: CountSummary;
    subscription: { activePremium: number };
    placement: { testSets: number; questions: number };
  };
}
