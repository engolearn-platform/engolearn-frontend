import type {
  PlacementReview,
  PlacementReviewOption,
  PlacementReviewQuestion,
} from "@features/placement/types/placement-review.types";

type OptionLabel = PlacementReviewOption["label"];
type QuestionSeed = {
  id: string;
  prompt: string;
  choices: [string, string, string, string];
  correct: OptionLabel;
  durationSeconds?: number;
};

/** A standalone Test Set snapshot, not a reference to the active-test mock. */
const SNAPSHOT: QuestionSeed[] = [
  { id: "r-a1-01", prompt: "She _____ a teacher at a local school.", choices: ["is", "are", "am", "be"], correct: "A" },
  { id: "r-a1-02", prompt: "They _____ to school every day.", choices: ["go", "goes", "going", "gone"], correct: "A" },
  { id: "r-a1-03", prompt: "I have two _____ at home.", choices: ["cats", "cat", "cates", "caties"], correct: "A" },
  { id: "r-a1-04", prompt: "This is _____ book, not mine.", choices: ["her", "she", "hers", "she's"], correct: "A" },
  { id: "r-a2-01", prompt: "My sister usually _____ to work by bus.", choices: ["go", "goes", "going", "gone"], correct: "B" },
  { id: "r-a2-02", prompt: "We have lived in this city _____ 2020.", choices: ["for", "since", "during", "from"], correct: "B" },
  { id: "r-a2-03", prompt: "If it rains tomorrow, we _____ at home.", choices: ["stay", "stayed", "will stay", "staying"], correct: "C" },
  { id: "r-a2-04", prompt: "He is taller _____ his brother.", choices: ["than", "then", "as", "so"], correct: "A" },
  { id: "r-b1-01", prompt: "By the time we arrived, the film _____.", choices: ["started", "had started", "has started", "was starting"], correct: "B" },
  { id: "r-b1-02", prompt: "The report _____ by the manager yesterday.", choices: ["wrote", "was written", "has written", "writing"], correct: "B" },
  { id: "r-b1-03", prompt: "She suggested _____ a short break before continuing.", choices: ["take", "taking", "to take", "took"], correct: "B" },
  { id: "r-b2-01", prompt: "Had I known about the traffic, I _____ earlier.", choices: ["would leave", "would have left", "had left", "will leave"], correct: "B" },
  { id: "r-b2-02", prompt: "The proposal is worth _____ careful consideration.", choices: ["to give", "giving", "give", "given"], correct: "B" },
  { id: "r-b2-03", prompt: "Not only _____ the exam, but he also got the highest score.", choices: ["he passed", "did he pass", "he did pass", "passed he"], correct: "B" },
  { id: "l-a1-01", prompt: "Where will the speakers meet?", choices: ["At the library", "At the station", "At the café", "At the office"], correct: "C", durationSeconds: 35 },
  { id: "l-a2-01", prompt: "What time will the meeting start?", choices: ["At 8:00", "At 8:30", "At 9:00", "At 9:30"], correct: "C", durationSeconds: 45 },
  { id: "l-b1-01", prompt: "What will the woman do next?", choices: ["Send an email", "Make a phone call", "Book a ticket", "Visit the office"], correct: "A", durationSeconds: 30 },
  { id: "l-b1-02", prompt: "Why is the man calling?", choices: ["To change an appointment", "To confirm an order", "To ask for directions", "To cancel a booking"], correct: "A", durationSeconds: 40 },
  { id: "l-b2-01", prompt: "What is the speaker's main concern about the project?", choices: ["The budget", "The deadline", "The staffing", "The quality"], correct: "B", durationSeconds: 50 },
  { id: "l-b2-02", prompt: "What does the woman imply about the new policy?", choices: ["It is too strict", "It will be revised", "It has been misunderstood", "It applies only to managers"], correct: "B", durationSeconds: 55 },
];

const CORRECT_ORDERS = new Set([1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 16, 17, 19]);
const UNANSWERED_ORDERS = new Set([15, 20]);
const OPTION_LABELS: OptionLabel[] = ["A", "B", "C", "D"];

const QUESTIONS: PlacementReviewQuestion[] = SNAPSHOT.map((seed, index) => {
  const order = index + 1;
  const options: PlacementReviewOption[] = seed.choices.map((text, position) => ({
    id: `${seed.id}-${OPTION_LABELS[position].toLowerCase()}`,
    label: OPTION_LABELS[position],
    text,
  }));
  const correctOptionId = `${seed.id}-${seed.correct.toLowerCase()}`;
  const selectedOptionId = UNANSWERED_ORDERS.has(order)
    ? null
    : CORRECT_ORDERS.has(order)
      ? correctOptionId
      : options.find((option) => option.id !== correctOptionId)!.id;

  return {
    id: seed.id,
    order,
    section: order <= 14 ? "READING" : "LISTENING",
    prompt: seed.prompt,
    options,
    selectedOptionId,
    correctOptionId,
    ...(seed.durationSeconds !== undefined
      ? { audio: { url: null, durationSeconds: seed.durationSeconds } }
      : {}),
  };
});

const B1_REVIEW: PlacementReview = {
  attemptId: "result-demo-b1",
  status: "SUBMITTED",
  totalQuestions: 20,
  score: 13,
  placementLevel: "B1",
  incorrectCount: 5,
  unansweredCount: 2,
  questions: QUESTIONS,
};

/** Return a fresh snapshot so callers cannot mutate the stored fixture. */
export function readMockPlacementReview(attemptId: string): PlacementReview {
  if (attemptId !== B1_REVIEW.attemptId) {
    throw new Error("Không tìm thấy chi tiết bài làm.");
  }

  return {
    ...B1_REVIEW,
    questions: B1_REVIEW.questions.map((question) => ({
      ...question,
      options: question.options.map((option) => ({ ...option })),
      ...(question.audio ? { audio: { ...question.audio } } : {}),
    })),
  };
}
