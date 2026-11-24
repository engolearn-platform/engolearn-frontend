import type {
  PlacementAnswer,
  PlacementAttemptDetail,
  PlacementLevel,
  PlacementOption,
  PlacementQuestion,
  PlacementSection,
  PlacementSubmitResult,
  PlacementSubmitStatus,
} from "../types/placement-attempt.types";
import type {
  PlacementClaimGate,
  PlacementClaimStatus,
} from "../types/placement-claim.types";
import type { PlacementAttemptStatus } from "../types/placement.types";

const ATTEMPT_DURATION_MS = 15 * 60 * 1000;
export const CLAIM_WINDOW_MS = 2 * 60 * 60 * 1000;
const MOCK_LATENCY_MS = 250;
const RESUME_DEMO_ATTEMPT_ID = "resume-demo-attempt";
const RESUME_DEMO_ANSWERED_COUNT = 8;

type QuestionSeed = Omit<PlacementQuestion, "order">;

function options(
  questionId: string,
  texts: [string, string, string, string],
): PlacementOption[] {
  return texts.map((text, index) => ({
    id: `${questionId}-${"abcd"[index]}`,
    label: "ABCD"[index] as PlacementOption["label"],
    text,
  }));
}

/**
 * Blueprint (BR-F4.2): 20 questions — 14 Reading + 6 Listening.
 * Per level: A1 4R+1L, A2 4R+1L, B1 3R+2L, B2 3R+2L.
 */
const READING_SEEDS: QuestionSeed[] = [
  {
    id: "r-a1-01",
    section: "READING",
    level: "A1",
    label: "Động từ to be",
    prompt: "She _____ a teacher at a local school.",
    options: options("r-a1-01", ["is", "are", "am", "be"]),
  },
  {
    id: "r-a1-02",
    section: "READING",
    level: "A1",
    label: "Thì hiện tại đơn",
    prompt: "They _____ to school every day.",
    options: options("r-a1-02", ["go", "goes", "going", "gone"]),
  },
  {
    id: "r-a1-03",
    section: "READING",
    level: "A1",
    label: "Danh từ số nhiều",
    prompt: "I have two _____ at home.",
    options: options("r-a1-03", ["cats", "cat", "cates", "caties"]),
  },
  {
    id: "r-a1-04",
    section: "READING",
    level: "A1",
    label: "Tính từ sở hữu",
    prompt: "This is _____ book, not mine.",
    options: options("r-a1-04", ["her", "she", "hers", "she's"]),
  },
  {
    id: "r-a2-01",
    section: "READING",
    level: "A2",
    label: "Thì hiện tại đơn",
    prompt: "My sister usually _____ to work by bus.",
    options: options("r-a2-01", ["go", "goes", "going", "gone"]),
  },
  {
    id: "r-a2-02",
    section: "READING",
    level: "A2",
    label: "Thì hiện tại hoàn thành",
    prompt: "We have lived in this city _____ 2020.",
    options: options("r-a2-02", ["for", "since", "during", "from"]),
  },
  {
    id: "r-a2-03",
    section: "READING",
    level: "A2",
    label: "Câu điều kiện loại 1",
    prompt: "If it rains tomorrow, we _____ at home.",
    options: options("r-a2-03", ["stay", "stayed", "will stay", "staying"]),
  },
  {
    id: "r-a2-04",
    section: "READING",
    level: "A2",
    label: "So sánh hơn",
    prompt: "He is taller _____ his brother.",
    options: options("r-a2-04", ["than", "then", "as", "so"]),
  },
  {
    id: "r-b1-01",
    section: "READING",
    level: "B1",
    label: "Thì quá khứ hoàn thành",
    prompt: "By the time we arrived, the film _____.",
    options: options("r-b1-01", [
      "started",
      "had started",
      "has started",
      "was starting",
    ]),
  },
  {
    id: "r-b1-02",
    section: "READING",
    level: "B1",
    label: "Câu bị động",
    prompt: "The report _____ by the manager yesterday.",
    options: options("r-b1-02", [
      "wrote",
      "was written",
      "has written",
      "writing",
    ]),
  },
  {
    id: "r-b1-03",
    section: "READING",
    level: "B1",
    label: "Danh động từ",
    prompt: "She suggested _____ a short break before continuing.",
    options: options("r-b1-03", ["take", "taking", "to take", "took"]),
  },
  {
    id: "r-b2-01",
    section: "READING",
    level: "B2",
    label: "Câu điều kiện loại 3",
    prompt: "Had I known about the traffic, I _____ earlier.",
    options: options("r-b2-01", [
      "would leave",
      "would have left",
      "had left",
      "will leave",
    ]),
  },
  {
    id: "r-b2-02",
    section: "READING",
    level: "B2",
    label: "Danh động từ sau tính từ",
    prompt: "The proposal is worth _____ careful consideration.",
    options: options("r-b2-02", ["to give", "giving", "give", "given"]),
  },
  {
    id: "r-b2-03",
    section: "READING",
    level: "B2",
    label: "Đảo ngữ",
    prompt: "Not only _____ the exam, but he also got the highest score.",
    options: options("r-b2-03", [
      "he passed",
      "did he pass",
      "he did pass",
      "passed he",
    ]),
  },
];

const LISTENING_SEEDS: QuestionSeed[] = [
  {
    id: "l-a1-01",
    section: "LISTENING",
    level: "A1",
    prompt: "Where will the speakers meet?",
    options: options("l-a1-01", [
      "At the library",
      "At the station",
      "At the café",
      "At the office",
    ]),
    audio: { url: null, durationSeconds: 35 },
  },
  {
    id: "l-a2-01",
    section: "LISTENING",
    level: "A2",
    prompt: "What time will the meeting start?",
    options: options("l-a2-01", ["At 8:00", "At 8:30", "At 9:00", "At 9:30"]),
    audio: { url: null, durationSeconds: 45 },
  },
  {
    id: "l-b1-01",
    section: "LISTENING",
    level: "B1",
    prompt: "What will the woman do next?",
    options: options("l-b1-01", [
      "Send an email",
      "Make a phone call",
      "Book a ticket",
      "Visit the office",
    ]),
    audio: { url: null, durationSeconds: 30 },
  },
  {
    id: "l-b1-02",
    section: "LISTENING",
    level: "B1",
    prompt: "Why is the man calling?",
    options: options("l-b1-02", [
      "To change an appointment",
      "To confirm an order",
      "To ask for directions",
      "To cancel a booking",
    ]),
    audio: { url: null, durationSeconds: 40 },
  },
  {
    id: "l-b2-01",
    section: "LISTENING",
    level: "B2",
    prompt: "What is the speaker's main concern about the project?",
    options: options("l-b2-01", [
      "The budget",
      "The deadline",
      "The staffing",
      "The quality",
    ]),
    audio: { url: null, durationSeconds: 50 },
  },
  {
    id: "l-b2-02",
    section: "LISTENING",
    level: "B2",
    prompt: "What does the woman imply about the new policy?",
    options: options("l-b2-02", [
      "It is too strict",
      "It will be revised",
      "It has been misunderstood",
      "It applies only to managers",
    ]),
    audio: { url: null, durationSeconds: 55 },
  },
];

/** Reading first, Listening second (BR-F1.8). */
export const MOCK_QUESTIONS: PlacementQuestion[] = [
  ...READING_SEEDS,
  ...LISTENING_SEEDS,
].map((seed, index) => ({ ...seed, order: index + 1 }));

export const MOCK_LEVELS: PlacementLevel[] = ["A1", "A2", "B1", "B2"];

export const MOCK_SECTIONS: PlacementSection[] = ["READING", "LISTENING"];

interface MockAttemptRecord {
  attemptId: string;
  status: PlacementAttemptStatus;
  startedAt: number;
  deadlineAt: number;
  /** Backend-owned end of the attempt; the claim window starts here. */
  endedAt: number | null;
  answers: Record<string, string | null>;
  claimRequired: boolean;
  submitResult: PlacementSubmitResult | null;
}

/**
 * In-memory only on purpose: the mock never persists attempts, so a full page
 * reload loses them (documented limitation). It must NOT recreate an attempt
 * with a fresh 15-minute deadline — only `createMockAttempt()` may start one.
 */
const attempts = new Map<string, MockAttemptRecord>();

let attemptSequence = 0;

function seedAnswers(questionCount: number): Record<string, string | null> {
  const answers: Record<string, string | null> = {};
  MOCK_QUESTIONS.slice(0, questionCount).forEach((question) => {
    answers[question.id] = question.options[0]?.id ?? null;
  });
  return answers;
}

export function createMockAttempt(): MockAttemptRecord {
  attemptSequence += 1;
  const now = Date.now();
  const record: MockAttemptRecord = {
    attemptId: `demo-attempt-${attemptSequence}`,
    status: "IN_PROGRESS",
    startedAt: now,
    deadlineAt: now + ATTEMPT_DURATION_MS,
    endedAt: null,
    answers: {},
    claimRequired: true,
    submitResult: null,
  };

  attempts.set(record.attemptId, record);
  return record;
}

/**
 * Returns the stored attempt or `null`. Never creates an attempt for an
 * unknown id — a reload must not extend the deadline.
 */
export function getMockAttempt(attemptId: string): MockAttemptRecord | null {
  const existing = attempts.get(attemptId);
  if (existing) return existing;

  if (attemptId !== RESUME_DEMO_ATTEMPT_ID) return null;

  const now = Date.now();
  const record: MockAttemptRecord = {
    attemptId,
    status: "IN_PROGRESS",
    startedAt: now,
    deadlineAt: now + ATTEMPT_DURATION_MS,
    endedAt: null,
    answers: seedAnswers(RESUME_DEMO_ANSWERED_COUNT),
    claimRequired: true,
    submitResult: null,
  };

  attempts.set(attemptId, record);
  return record;
}

export function toAttemptDetail(record: MockAttemptRecord): PlacementAttemptDetail {
  const answers: PlacementAnswer[] = MOCK_QUESTIONS.map((question) => ({
    questionId: question.id,
    selectedOptionId: record.answers[question.id] ?? null,
  }));

  return {
    attemptId: record.attemptId,
    status: record.status,
    startedAt: new Date(record.startedAt).toISOString(),
    deadlineAt: new Date(record.deadlineAt).toISOString(),
    serverNow: new Date().toISOString(),
    totalQuestions: MOCK_QUESTIONS.length,
    questions: MOCK_QUESTIONS,
    answers,
    claimRequired: record.claimRequired,
  };
}

function countAnswers(record: MockAttemptRecord): number {
  return Object.values(record.answers).filter((value) => value != null).length;
}

export function saveMockAnswer(
  attemptId: string,
  questionId: string,
  selectedOptionId: string | null,
): void {
  const record = getMockAttempt(attemptId);
  if (!record) throw new Error("Không tìm thấy bài kiểm tra.");
  if (record.status !== "IN_PROGRESS") return;

  record.answers[questionId] = selectedOptionId;
}

export function submitMockAttempt(attemptId: string): PlacementSubmitResult {
  const record = getMockAttempt(attemptId);
  if (!record) throw new Error("Không tìm thấy bài kiểm tra.");

  if (record.submitResult) return record.submitResult;

  const answeredCount = countAnswers(record);
  const afterDeadline = Date.now() >= record.deadlineAt;

  if (answeredCount === 0 && !afterDeadline) {
    throw new Error("Bạn chưa trả lời câu hỏi nào.");
  }

  let status: PlacementSubmitStatus;
  let endedAt: number;
  if (answeredCount === 0) {
    status = "EXPIRED";
    endedAt = record.deadlineAt;
  } else if (afterDeadline) {
    status = "AUTO_SUBMITTED";
    endedAt = record.deadlineAt;
  } else {
    status = "SUBMITTED";
    endedAt = Date.now();
  }

  record.status = status;
  record.endedAt = endedAt;
  record.submitResult = {
    attemptId,
    status,
    answeredCount,
    claimRequired: record.claimRequired,
  };

  return record.submitResult;
}

/**
 * Deterministic test-only attempt ids for states the mock cannot reach on its
 * own (no auth, no clock travel). Never produced by `createMockAttempt()`.
 */
const CLAIM_DEMO_SCENARIOS: Record<string, PlacementClaimStatus> = {
  "claim-demo-expired": "CLAIM_EXPIRED",
  "claim-demo-mismatch": "SESSION_MISMATCH",
  "claim-demo-owned": "OWNED_BY_OTHER",
  "claim-demo-has-result": "USER_HAS_RESULT",
  "claim-demo-already-claimed": "ALREADY_CLAIMED",
};

/**
 * Mock of the post-submit dispatcher state.
 * `claimExpiresAt = endedAt + 2h` (BR-F2.4); `EXPIRED` has no result
 * (BR-F1.13) so it maps to `NO_RESULT` and can never be claimed.
 */
export function readMockClaimGate(attemptId: string): PlacementClaimGate {
  const serverNow = new Date().toISOString();
  const demoStatus = Object.prototype.hasOwnProperty.call(
    CLAIM_DEMO_SCENARIOS,
    attemptId,
  )
    ? CLAIM_DEMO_SCENARIOS[attemptId]
    : undefined;

  if (demoStatus) {
    return {
      attemptId,
      attemptStatus: "SUBMITTED",
      claimStatus: demoStatus,
      claimExpiresAt: null,
      serverNow,
      resultAttemptId: null,
    };
  }

  const record = getMockAttempt(attemptId);
  if (!record) throw new Error("Không tìm thấy bài làm.");
  if (!record.submitResult) throw new Error("Bài làm chưa được nộp.");

  const { status } = record.submitResult;
  if (status === "EXPIRED" || record.endedAt === null) {
    return {
      attemptId,
      attemptStatus: "EXPIRED",
      claimStatus: "NO_RESULT",
      claimExpiresAt: null,
      serverNow,
      resultAttemptId: null,
    };
  }

  const claimExpiresAt = record.endedAt + CLAIM_WINDOW_MS;

  return {
    attemptId,
    attemptStatus: status,
    claimStatus: Date.now() >= claimExpiresAt ? "CLAIM_EXPIRED" : "CLAIMABLE",
    claimExpiresAt: new Date(claimExpiresAt).toISOString(),
    serverNow,
    resultAttemptId: null,
  };
}

export async function mockLatency(signal?: AbortSignal): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const handleAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };

    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort);
      resolve();
    }, MOCK_LATENCY_MS);

    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}
