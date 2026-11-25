import * as React from "react";
import { hasRequiredRole } from "@features/auth/contract";
import { useAuth } from "@shared/hooks/useAuth";
import { companionService, toCompanionApiError } from "../services/companion.service";
import { streamCompanionTurn } from "../services/companion-stream.service";
import type {
  CompanionContextValue,
  CompanionConversation,
  CompanionMessage,
  CompanionMode,
  CompanionQuotaItem,
  CompanionState,
  CompanionTurnEvent,
} from "../types/companion.types";

const INITIAL_STATE: CompanionState = {
  panelOpen: false,
  panelMinimized: false,
  mode: "home",
  recentConversations: [],
  historyConversations: [],
  historyCursor: null,
  hasMoreHistory: false,
  activeConversation: null,
  messages: [],
  messagesBeforeSequence: null,
  hasOlderMessages: false,
  quota: null,
  draft: "",
  stream: "idle",
  partialText: "",
  statusCode: null,
  error: null,
  retryAvailable: false,
  incomplete: false,
  isHomeLoading: false,
  isHistoryLoading: false,
  isMessagesLoading: false,
  isQuotaLoading: false,
  isSending: false,
  isAtCapacity: false,
  canSubmit: false,
};

interface SessionTurn {
  conversationId: string;
  turnId: string;
  content: string;
  baselineMessageCount: number;
  retryAvailable: boolean;
}

const CompanionContext = React.createContext<CompanionContextValue | null>(null);

function derive(state: CompanionState, pending: SessionTurn | null): CompanionState {
  const active = state.activeConversation;
  const isRetry = Boolean(pending?.retryAvailable && active?.id === pending.conversationId && state.retryAvailable);
  const remaining = active ? active.maxMessages - active.messageCount : Number.POSITIVE_INFINITY;
  const isAtCapacity = Boolean(active && remaining < (isRetry ? 1 : 2));
  const canSubmit = Boolean(
    state.draft.trim() && !state.isSending && state.stream !== "reconciling" &&
      !isAtCapacity && !isRetry && (state.quota === null || state.quota.remaining > 0),
  );
  return { ...state, isAtCapacity, canSubmit };
}

export function useCompanion(): CompanionContextValue {
  const context = React.useContext(CompanionContext);
  if (!context) throw new Error("useCompanion must be used within CompanionProvider");
  return context;
}

export function CompanionProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, error: authError, identityGeneration } = useAuth();
  const authorized = !isLoading && !authError && isAuthenticated && hasRequiredRole(user?.role ?? null, ["USER"]);
  const identityKey = `${identityGeneration}:${user?.id ?? "guest"}:${authorized ? "allowed" : "hidden"}`;
  const identityRef = React.useRef(identityKey);
  identityRef.current = identityKey;
  const authorizedRef = React.useRef(authorized);
  authorizedRef.current = authorized;

  const pendingTurnRef = React.useRef<SessionTurn | null>(null);
  const turnControllerRef = React.useRef<AbortController | null>(null);
  const turnIdentityRef = React.useRef<string | null>(null);
  const createInFlightRef = React.useRef(false);
  const createIdentityRef = React.useRef<string | null>(null);
  const draftVersionRef = React.useRef(0);
  const operationControllers = React.useRef(new Map<string, AbortController>());
  const inFlightTurnRef = React.useRef(false);
  const [state, setReactState] = React.useState(() => derive(INITIAL_STATE, null));
  const stateRef = React.useRef(state);
  stateRef.current = state;

  const patch = React.useCallback((updates: Partial<CompanionState> | ((current: CompanionState) => Partial<CompanionState>)) => {
    const current = stateRef.current;
    const delta = typeof updates === "function" ? updates(current) : updates;
    const next = derive({ ...current, ...delta }, pendingTurnRef.current);
    stateRef.current = next;
    setReactState(next);
  }, []);

  const isCurrent = React.useCallback((identity: string) => identityRef.current === identity && authorizedRef.current, []);

  const beginOperation = React.useCallback((key: string) => {
    operationControllers.current.get(key)?.abort();
    const controller = new AbortController();
    operationControllers.current.set(key, controller);
    return controller;
  }, []);

  React.useEffect(() => {
    for (const controller of operationControllers.current.values()) controller.abort();
    operationControllers.current.clear();
    turnControllerRef.current?.abort();
    turnControllerRef.current = null;
    turnIdentityRef.current = null;
    createInFlightRef.current = false;
    createIdentityRef.current = null;
    inFlightTurnRef.current = false;
    pendingTurnRef.current = null;
    const clean = derive({ ...INITIAL_STATE }, null);
    stateRef.current = clean;
    setReactState(clean);
  }, [identityKey]);

  const loadQuota = React.useCallback(async (identity = identityRef.current) => {
    if (!isCurrent(identity)) return;
    const controller = beginOperation("quota");
    patch({ isQuotaLoading: true });
    try {
      const response = await companionService.getQuotaUsage(controller.signal);
      if (!controller.signal.aborted && isCurrent(identity)) {
        const item = response.items.find((candidate) => candidate.quotaType === "AI_COMPANION_TOKEN_USAGE") ?? null;
        const valid: CompanionQuotaItem | null = item &&
          Number.isFinite(item.remaining) && Number.isFinite(item.limit) && item.remaining >= 0 && item.limit >= 0 &&
          typeof item.windowEndsAt === "string" ? item : null;
        patch({ quota: valid });
      }
    } catch {
      if (!controller.signal.aborted && isCurrent(identity)) patch({ quota: null });
    } finally {
      if (operationControllers.current.get("quota") === controller) operationControllers.current.delete("quota");
      if (!controller.signal.aborted && isCurrent(identity)) patch({ isQuotaLoading: false });
    }
  }, [beginOperation, isCurrent, patch]);

  const loadHome = React.useCallback(async () => {
    const identity = identityRef.current;
    if (!isCurrent(identity)) return;
    const controller = beginOperation("home");
    patch({ isHomeLoading: true, error: null });
    const quotaTask = loadQuota(identity);
    try {
      const page = await companionService.listConversations(3, undefined, controller.signal);
      if (!controller.signal.aborted && isCurrent(identity)) patch({ recentConversations: page.items });
    } catch (error) {
      if (!controller.signal.aborted && isCurrent(identity)) patch({ error: toCompanionApiError(error).message });
    } finally {
      void quotaTask;
      if (operationControllers.current.get("home") === controller) operationControllers.current.delete("home");
      if (!controller.signal.aborted && isCurrent(identity)) patch({ isHomeLoading: false });
    }
  }, [beginOperation, isCurrent, loadQuota, patch]);

  const loadHistory = React.useCallback(async () => {
    const identity = identityRef.current;
    if (!isCurrent(identity)) return;
    const controller = beginOperation("history");
    patch({ isHistoryLoading: true, error: null });
    try {
      const page = await companionService.listConversations(20, undefined, controller.signal);
      if (!controller.signal.aborted && isCurrent(identity)) {
        patch({ historyConversations: page.items, historyCursor: page.nextCursor, hasMoreHistory: page.nextCursor !== null });
      }
    } catch (error) {
      if (!controller.signal.aborted && isCurrent(identity)) patch({ error: toCompanionApiError(error).message });
    } finally {
      if (operationControllers.current.get("history") === controller) operationControllers.current.delete("history");
      if (!controller.signal.aborted && isCurrent(identity)) patch({ isHistoryLoading: false });
    }
  }, [beginOperation, isCurrent, patch]);

  const loadMoreHistory = React.useCallback(async () => {
    const { historyCursor, hasMoreHistory, isHistoryLoading } = stateRef.current;
    const identity = identityRef.current;
    if (!historyCursor || !hasMoreHistory || isHistoryLoading || !isCurrent(identity)) return;
    const controller = beginOperation("history-more");
    patch({ isHistoryLoading: true, error: null });
    try {
      const page = await companionService.listConversations(20, historyCursor, controller.signal);
      if (!controller.signal.aborted && isCurrent(identity)) {
        patch((current) => ({
          historyConversations: [...current.historyConversations, ...page.items],
          historyCursor: page.nextCursor,
          hasMoreHistory: page.nextCursor !== null,
        }));
      }
    } catch (error) {
      if (!controller.signal.aborted && isCurrent(identity)) patch({ error: toCompanionApiError(error).message });
    } finally {
      if (operationControllers.current.get("history-more") === controller) operationControllers.current.delete("history-more");
      if (!controller.signal.aborted && isCurrent(identity)) patch({ isHistoryLoading: false });
    }
  }, [beginOperation, isCurrent, patch]);

  const openConversation = React.useCallback(async (item: CompanionConversation | string) => {
    const identity = identityRef.current;
    if (!isCurrent(identity) || inFlightTurnRef.current) return;
    const conversationId = typeof item === "string" ? item : item.id;
    const controller = beginOperation("messages");
    const known = typeof item === "string" ? null : item;
    patch({
      mode: "conversation", activeConversation: known, messages: [], messagesBeforeSequence: null,
      hasOlderMessages: false, isMessagesLoading: true, error: null, retryAvailable: false, incomplete: false, statusCode: null,
    });
    try {
      const conversationTask = known ? Promise.resolve(known) : companionService.getConversation(conversationId, controller.signal);
      const [conversation, page] = await Promise.all([
        conversationTask,
        companionService.listMessages(conversationId, 20, undefined, controller.signal),
      ]);
      if (!controller.signal.aborted && isCurrent(identity)) {
        const pending = pendingTurnRef.current;
        patch({
          activeConversation: conversation,
          messages: page.items,
          messagesBeforeSequence: page.nextBeforeSequence,
          hasOlderMessages: page.nextBeforeSequence !== null,
          retryAvailable: Boolean(pending?.retryAvailable && pending.conversationId === conversationId && isUnansweredLatest(page.items, pending)),
        });
      }
    } catch (error) {
      if (!controller.signal.aborted && isCurrent(identity)) patch({ error: toCompanionApiError(error).message });
    } finally {
      if (operationControllers.current.get("messages") === controller) operationControllers.current.delete("messages");
      if (!controller.signal.aborted && isCurrent(identity)) patch({ isMessagesLoading: false });
    }
  }, [beginOperation, isCurrent, patch]);

  const loadOlderMessages = React.useCallback(async () => {
    const { activeConversation, messagesBeforeSequence, hasOlderMessages, isMessagesLoading } = stateRef.current;
    const identity = identityRef.current;
    if (!activeConversation || messagesBeforeSequence === null || !hasOlderMessages || isMessagesLoading || !isCurrent(identity)) return;
    const controller = beginOperation("messages-older");
    patch({ isMessagesLoading: true, error: null });
    try {
      const page = await companionService.listMessages(activeConversation.id, 20, messagesBeforeSequence, controller.signal);
      if (!controller.signal.aborted && isCurrent(identity) && stateRef.current.activeConversation?.id === activeConversation.id) {
        patch((current) => ({
          messages: [...page.items, ...current.messages],
          messagesBeforeSequence: page.nextBeforeSequence,
          hasOlderMessages: page.nextBeforeSequence !== null,
        }));
      }
    } catch (error) {
      if (!controller.signal.aborted && isCurrent(identity)) patch({ error: toCompanionApiError(error).message });
    } finally {
      if (operationControllers.current.get("messages-older") === controller) operationControllers.current.delete("messages-older");
      if (!controller.signal.aborted && isCurrent(identity)) patch({ isMessagesLoading: false });
    }
  }, [beginOperation, isCurrent, patch]);

  const createConversationInternal = React.useCallback(async (fromTurn: boolean) => {
    const identity = identityRef.current;
    if (!isCurrent(identity) || createInFlightRef.current || (inFlightTurnRef.current && !fromTurn)) return null;
    createInFlightRef.current = true;
    createIdentityRef.current = identity;
    const controller = beginOperation("create");
    patch({ error: null });
    try {
      const conversation = await companionService.createConversation(controller.signal);
      if (!controller.signal.aborted && isCurrent(identity)) {
        pendingTurnRef.current = null;
        patch({
          activeConversation: conversation, messages: [], messagesBeforeSequence: null, hasOlderMessages: false,
          retryAvailable: false, incomplete: false, partialText: "", mode: "conversation", statusCode: null,
        });
        void loadHome();
        return conversation;
      }
    } catch (error) {
      if (!controller.signal.aborted && isCurrent(identity)) patch({ error: toCompanionApiError(error).message });
    } finally {
      if (operationControllers.current.get("create") === controller) operationControllers.current.delete("create");
      if (createIdentityRef.current === identity) {
        createInFlightRef.current = false;
        createIdentityRef.current = null;
      }
    }
    return null;
  }, [beginOperation, isCurrent, loadHome, patch]);

  const createConversation = React.useCallback(() => createConversationInternal(false), [createConversationInternal]);

  const deleteConversation = React.useCallback(async (conversationId: string) => {
    const identity = identityRef.current;
    if (!isCurrent(identity) || inFlightTurnRef.current) return;
    const controller = beginOperation("delete");
    patch({ error: null });
    try {
      await companionService.deleteConversation(conversationId, controller.signal);
      if (!controller.signal.aborted && isCurrent(identity)) {
        if (pendingTurnRef.current?.conversationId === conversationId) pendingTurnRef.current = null;
        patch((current) => ({
          activeConversation: current.activeConversation?.id === conversationId ? null : current.activeConversation,
          messages: current.activeConversation?.id === conversationId ? [] : current.messages,
          mode: current.activeConversation?.id === conversationId ? "home" : current.mode,
          retryAvailable: current.activeConversation?.id === conversationId ? false : current.retryAvailable,
        }));
        void loadHome();
        void loadHistory();
      }
    } catch (error) {
      if (!controller.signal.aborted && isCurrent(identity)) patch({ error: toCompanionApiError(error).message });
    } finally {
      if (operationControllers.current.get("delete") === controller) operationControllers.current.delete("delete");
    }
  }, [beginOperation, isCurrent, loadHistory, loadHome, patch]);

  const reconcile = React.useCallback(async (
    turn: SessionTurn,
    identity: string,
    controller: AbortController,
    allowRetryIfUnanswered: boolean,
    notice?: "STOPPED" | "INTERRUPTED",
  ) => {
    if (!isCurrent(identity)) return false;
    patch({ stream: "reconciling", statusCode: null });
    try {
      const [conversation, page] = await Promise.all([
        companionService.getConversation(turn.conversationId, controller.signal),
        companionService.listMessages(turn.conversationId, 20, undefined, controller.signal),
      ]);
      if (controller.signal.aborted || !isCurrent(identity) || stateRef.current.activeConversation?.id !== turn.conversationId) return false;
      const unresolved = isUnansweredLatest(page.items, turn);
      const completed = isCompletedTurn(page.items, turn);
      if (!unresolved && page.items.some((message) => message.role === "ASSISTANT" && message.sequence > 0)) {
        pendingTurnRef.current = null;
      } else if (unresolved && (turn.retryAvailable || allowRetryIfUnanswered)) {
        pendingTurnRef.current = { ...turn, retryAvailable: true };
      } else if (unresolved) {
        pendingTurnRef.current = { ...turn, retryAvailable: false };
      }
      patch({
        activeConversation: conversation,
        messages: page.items,
        messagesBeforeSequence: page.nextBeforeSequence,
        hasOlderMessages: page.nextBeforeSequence !== null,
        retryAvailable: unresolved && Boolean(pendingTurnRef.current?.retryAvailable),
        incomplete: Boolean(stateRef.current.partialText),
        statusCode: notice && !completed ? notice : null,
      });
      return unresolved;
    } catch (error) {
      if (!controller.signal.aborted && isCurrent(identity)) patch({ error: toCompanionApiError(error).message });
      return false;
    }
  }, [isCurrent, patch]);

  const startTurn = React.useCallback(async (retry: boolean) => {
    if (inFlightTurnRef.current || !authorizedRef.current) return;
    if (!retry && !stateRef.current.activeConversation && createInFlightRef.current) return;
    const identity = identityRef.current;
    let turn = retry ? pendingTurnRef.current : null;
    const originalDraft = stateRef.current.draft;
    const submittedDraftVersion = draftVersionRef.current;
    if (retry && (!turn || !turn.retryAvailable || turn.conversationId !== stateRef.current.activeConversation?.id)) return;
    if (!retry && !originalDraft.trim()) return;
    inFlightTurnRef.current = true;
    turnIdentityRef.current = identity;
    patch({ isSending: true, stream: "connecting", error: null, statusCode: null, partialText: "", incomplete: false, retryAvailable: false });
    let conversation = stateRef.current.activeConversation;
    if (!retry && !conversation) {
      conversation = await createConversationInternal(true);
      if (!conversation || !isCurrent(identity)) {
        if (turnIdentityRef.current === identity) {
          inFlightTurnRef.current = false;
          turnIdentityRef.current = null;
          patch({ isSending: false, stream: "idle" });
        }
        return;
      }
    }
    if (!conversation) {
      if (turnIdentityRef.current === identity) {
        inFlightTurnRef.current = false;
        turnIdentityRef.current = null;
        patch({ isSending: false, stream: "idle" });
      }
      return;
    }
    if (!retry && conversation.maxMessages - conversation.messageCount < 2) {
      if (turnIdentityRef.current === identity) {
        inFlightTurnRef.current = false;
        turnIdentityRef.current = null;
        patch({ isSending: false, stream: "idle", error: "This conversation has reached its message limit." });
      }
      return;
    }
    if (!turn) {
      if (!globalThis.crypto?.randomUUID) {
        if (turnIdentityRef.current === identity) {
          inFlightTurnRef.current = false;
          turnIdentityRef.current = null;
          patch({ isSending: false, stream: "idle", error: "A secure turn identifier could not be created." });
        }
        return;
      }
      turn = {
        conversationId: conversation.id,
        turnId: globalThis.crypto.randomUUID(),
        content: originalDraft,
        baselineMessageCount: conversation.messageCount,
        retryAvailable: false,
      };
      pendingTurnRef.current = turn;
    }

    const controller = new AbortController();
    turnControllerRef.current = controller;
    let accepted = false;
    let terminal = false;
    try {
      const result = await streamCompanionTurn(conversation.id, {
        turnId: turn.turnId,
        content: turn.content,
        retry,
      }, controller.signal, (event: CompanionTurnEvent) => {
        if (!isCurrent(identity) || controller.signal.aborted) return;
        if (event.event === "delta") {
          patch((current) => ({ stream: "streaming", statusCode: null, partialText: current.partialText + event.data.text }));
        } else if (event.event === "status") {
          if (event.data.code === "ASSESSMENT_LOOKUP") patch({ statusCode: "ASSESSMENT_LOOKUP" });
        } else if (event.event === "completed" && event.data.turnId === turn?.turnId) {
          terminal = true;
          pendingTurnRef.current = null;
          const assistant = event.data.assistantMessage;
          patch((current) => ({
            messages: current.messages.some((message) => message.id === assistant.id) ? current.messages : [...current.messages, assistant],
            activeConversation: current.activeConversation ? {
              ...current.activeConversation,
              messageCount: event.data.messageCount,
              maxMessages: event.data.maxMessages,
            } : current.activeConversation,
            stream: "idle", isSending: false, partialText: "", statusCode: null, incomplete: false,
            retryAvailable: false, error: null,
          }));
        } else if (event.event === "error" && event.data.turnId === turn?.turnId) {
          terminal = true;
          pendingTurnRef.current = { ...turn!, retryAvailable: event.data.retryable };
          patch({ stream: "reconciling", statusCode: null, error: event.data.detail });
        }
      }, () => {
        accepted = true;
        if (isCurrent(identity)) {
          if (!retry && stateRef.current.draft === turn?.content) patch({ draft: "" });
          const lastMessage = stateRef.current.messages[stateRef.current.messages.length - 1];
          if (!retry) {
            const userMessage: CompanionMessage = {
              id: `pending-${turn?.turnId ?? "turn"}`,
              sequence: (lastMessage?.sequence ?? 0) + 1,
              role: "USER",
              content: turn?.content ?? "",
              createdAt: new Date().toISOString(),
            };
            patch((current) => ({
              messages: current.messages.some((message) => message.id.startsWith("pending-") && message.content === userMessage.content)
                ? current.messages
                : [...current.messages, userMessage],
            }));
          }
          patch({ stream: "streaming" });
        }
      });
      if (controller.signal.aborted || !isCurrent(identity)) return;
      if (result.terminal === "completed") {
        await reconcile(turn, identity, new AbortController(), false);
        pendingTurnRef.current = null;
        void loadQuota(identity);
        void loadHome();
      } else if (result.terminal === "error") {
        const currentTurn = pendingTurnRef.current ?? turn;
        pendingTurnRef.current = { ...currentTurn, retryAvailable: result.errorRetryable };
        await reconcile(pendingTurnRef.current, identity, controller, result.errorRetryable);
      } else {
        const currentTurn = pendingTurnRef.current ?? turn;
        pendingTurnRef.current = { ...currentTurn, retryAvailable: false };
        await reconcile(pendingTurnRef.current, identity, controller, false, "INTERRUPTED");
      }
      if (isCurrent(identity)) patch({ stream: "idle", isSending: false, incomplete: !terminal && Boolean(stateRef.current.partialText) });
    } catch (error) {
      if (!controller.signal.aborted && isCurrent(identity)) {
        const apiError = toCompanionApiError(error);
        const malformedSuccess = apiError.code === "COMPANION_INVALID_STREAM_RESPONSE" && apiError.status !== undefined && apiError.status >= 200 && apiError.status < 300;
        const possiblyAdmitted = accepted || malformedSuccess || apiError.status === 503 || apiError.status === 504 || apiError.status === undefined;
        const quotaRejected = apiError.status === 429;
        if (!accepted && quotaRejected) {
          pendingTurnRef.current = null;
          patch({ error: apiError.message, retryAvailable: false });
          void loadQuota(identity);
        } else if (possiblyAdmitted && turn) {
          pendingTurnRef.current = { ...turn, retryAvailable: false };
          patch({ error: apiError.message, stream: "reconciling" });
          const confirmed = await reconcile(pendingTurnRef.current, identity, controller, false);
          if (malformedSuccess && confirmed && !retry && stateRef.current.draft === turn.content && draftVersionRef.current === submittedDraftVersion) {
            patch({ draft: "" });
          }
        } else {
          pendingTurnRef.current = null;
          patch({ error: apiError.message, retryAvailable: false });
        }
        if (isCurrent(identity)) patch({ stream: "idle", isSending: false, incomplete: Boolean(stateRef.current.partialText) });
      }
    } finally {
      if (turnControllerRef.current === controller) turnControllerRef.current = null;
      if (turnIdentityRef.current === identity) {
        inFlightTurnRef.current = false;
        turnIdentityRef.current = null;
      }
    }
  }, [createConversationInternal, isCurrent, loadHome, loadQuota, patch, reconcile]);

  const openPanel = React.useCallback(() => {
    if (!authorizedRef.current) return;
    patch({ panelOpen: true, panelMinimized: false });
    void loadHome();
  }, [loadHome, patch]);

  const closePanel = React.useCallback(() => patch({ panelOpen: false }), [patch]);
  const minimizePanel = React.useCallback(() => patch({ panelMinimized: true }), [patch]);
  const setMode = React.useCallback((mode: CompanionMode) => {
    patch({ mode });
    if (mode === "home") void loadHome();
    if (mode === "history") void loadHistory();
  }, [loadHistory, loadHome, patch]);
  const setDraft = React.useCallback((draft: string) => {
    draftVersionRef.current += 1;
    patch({ draft });
  }, [patch]);
  const submitTurn = React.useCallback(() => startTurn(false), [startTurn]);
  const retryTurn = React.useCallback(() => startTurn(true), [startTurn]);
  const stopTurn = React.useCallback(() => {
    const controller = turnControllerRef.current;
    const turn = pendingTurnRef.current;
    if (!controller || !turn) return;
    controller.abort();
    pendingTurnRef.current = { ...turn, retryAvailable: false };
    patch({ isSending: false, stream: "reconciling", statusCode: null, incomplete: Boolean(stateRef.current.partialText) });
    const identity = identityRef.current;
    const reconciliationController = new AbortController();
    void reconcile(pendingTurnRef.current, identity, reconciliationController, false, "STOPPED").then(() => {
      if (isCurrent(identity)) patch({ stream: "idle", isSending: false });
    });
  }, [isCurrent, patch, reconcile]);

  const contextValue = React.useMemo<CompanionContextValue>(() => ({
    state,
    openPanel,
    closePanel,
    minimizePanel,
    setMode,
    setDraft,
    loadHome,
    loadHistory,
    loadMoreHistory,
    openConversation,
    loadOlderMessages,
    createConversation,
    deleteConversation,
    submitTurn,
    retryTurn,
    stopTurn,
    refreshQuota: loadQuota,
  }), [state, openPanel, closePanel, minimizePanel, setMode, setDraft, loadHome, loadHistory, loadMoreHistory,
    openConversation, loadOlderMessages, createConversation, deleteConversation, submitTurn, retryTurn, stopTurn, loadQuota]);

  return <CompanionContext.Provider value={contextValue}>{children}</CompanionContext.Provider>;
}

function isUnansweredLatest(messages: CompanionMessage[], turn: SessionTurn): boolean {
  const last = messages[messages.length - 1];
  return last?.role === "USER" && last.content === turn.content && last.sequence === turn.baselineMessageCount + 1;
}

function isCompletedTurn(messages: CompanionMessage[], turn: SessionTurn): boolean {
  const user = messages.find((message) => message.sequence === turn.baselineMessageCount + 1);
  const assistant = messages.find((message) => message.sequence === turn.baselineMessageCount + 2);
  return user?.role === "USER" && user.content === turn.content && assistant?.role === "ASSISTANT";
}
