export interface CompanionConversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  maxMessages: number;
  warningThreshold: number;
}

export interface CompanionConversationPage {
  items: CompanionConversation[];
  nextCursor: string | null;
}

export interface CompanionMessage {
  id: string;
  sequence: number;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

export interface CompanionMessagePage {
  items: CompanionMessage[];
  nextBeforeSequence: number | null;
}

export interface CompanionQuotaItem {
  quotaType: string;
  displayName: string;
  used: number;
  limit: number;
  remaining: number;
  unit: string;
  period: string;
  windowStartAt?: string;
  windowEndsAt: string;
  allowanceStartAt?: string;
  status: string;
  overLimitAmount?: number;
}

export interface CompanionQuotaUsage {
  items: CompanionQuotaItem[];
}

export interface CompanionTurnRequest {
  turnId: string;
  content: string;
  retry: boolean;
}

export type CompanionTurnEvent =
  | { event: "delta"; data: { text: string } }
  | {
      event: "completed";
      data: {
        turnId: string;
        assistantMessage: CompanionMessage;
        messageCount: number;
        maxMessages: number;
        warning: boolean;
      };
    }
  | {
      event: "error";
      data: { turnId: string; code: string; detail: string; retryable: boolean };
    }
  | { event: "status"; data: { code: "ASSESSMENT_LOOKUP" | string } };

export interface CompanionProblem {
  status?: number;
  code?: string;
  detail?: string;
  title?: string;
  retryable?: boolean;
}

export class CompanionApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly retryable?: boolean;

  constructor(message: string, problem: CompanionProblem = {}) {
    super(message);
    this.name = "CompanionApiError";
    this.status = problem.status;
    this.code = problem.code;
    this.retryable = problem.retryable;
  }
}

export type CompanionMode = "home" | "history" | "conversation";
export type CompanionStreamState = "idle" | "connecting" | "streaming" | "reconciling";

export interface CompanionState {
  panelOpen: boolean;
  panelMinimized: boolean;
  mode: CompanionMode;
  recentConversations: CompanionConversation[];
  historyConversations: CompanionConversation[];
  historyCursor: string | null;
  hasMoreHistory: boolean;
  activeConversation: CompanionConversation | null;
  messages: CompanionMessage[];
  messagesBeforeSequence: number | null;
  hasOlderMessages: boolean;
  quota: CompanionQuotaItem | null;
  draft: string;
  stream: CompanionStreamState;
  partialText: string;
  statusCode: "ASSESSMENT_LOOKUP" | "STOPPED" | "INTERRUPTED" | null;
  error: string | null;
  retryAvailable: boolean;
  incomplete: boolean;
  isHomeLoading: boolean;
  isHistoryLoading: boolean;
  isMessagesLoading: boolean;
  isQuotaLoading: boolean;
  isSending: boolean;
  isAtCapacity: boolean;
  canSubmit: boolean;
}

export interface CompanionContextValue {
  state: CompanionState;
  openPanel: () => void;
  closePanel: () => void;
  minimizePanel: () => void;
  setMode: (mode: CompanionMode) => void;
  setDraft: (draft: string) => void;
  loadHome: () => Promise<void>;
  loadHistory: () => Promise<void>;
  loadMoreHistory: () => Promise<void>;
  openConversation: (conversation: CompanionConversation | string) => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  createConversation: () => Promise<CompanionConversation | null>;
  deleteConversation: (conversationId: string) => Promise<void>;
  submitTurn: () => Promise<void>;
  retryTurn: () => Promise<void>;
  stopTurn: () => void;
  refreshQuota: () => Promise<void>;
}
