import * as React from "react";
import { hasRequiredRole } from "@features/auth/contract";
import { useAuth } from "@shared/hooks/useAuth";
import { companionService, toCompanionApiError } from "../services/companion.service";
import { streamCompanionTurn } from "../services/companion-stream.service";
import type {
  CompanionContextValue,
  CompanionConversation,
  CompanionMessage,
  CompanionMemory,
  CompanionMemoryCategory,
  CompanionMemoryOperationReceipt,
  CompanionMode,
  CompanionQuotaItem,
  CompanionState,
  CompanionTurnEvent,
  FirstTurnStatus,
  AvailableScreenContext,
  ScreenContextReference,
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
  attachedContext: null,
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
  firstAdmissionPending: false,
  pendingQuestion: null,
  isAtCapacity: false,
  canSubmit: false,
  memories: [],
  memoryCursor: null,
  memoryCategory: "ALL",
  memoryLoading: false,
  memoryError: null,
  automaticMemoryEnabled: true,
  memorySettingsLoading: false,
  memoryOperations: [],
  memoryMutationLoading: false,
};

interface FirstRequest {
  identity: string;
  turnId: string;
  content: string;
  context?: ScreenContextReference;
  draftVersion: number;
  attachmentVersion: number;
  retryable: boolean;
  admitted: boolean;
}

interface SessionTurn {
  conversationId: string;
  turnId: string;
  content: string;
  baselineMessageCount: number;
  screenContext?: ScreenContextReference;
  retryAvailable: boolean;
}

const CompanionContext = React.createContext<CompanionContextValue | null>(null);

function derive(state: CompanionState, pending: SessionTurn | null): CompanionState {
  const active = state.mode === "home" ? null : state.activeConversation;
  const isRetry = Boolean(pending?.retryAvailable && active?.id === pending.conversationId && state.retryAvailable);
  const remaining = active ? active.maxMessages - active.messageCount : Number.POSITIVE_INFINITY;
  const isAtCapacity = Boolean(active && remaining < (isRetry ? 1 : 2));
  const canSubmit = Boolean(
    state.draft.trim() && !state.isMessagesLoading && !state.isSending && !state.firstAdmissionPending && state.stream !== "reconciling" &&
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
  const firstRequestRef = React.useRef<FirstRequest | null>(null);
  const draftOriginRef = React.useRef<string | null>(null);
  const draftVersionRef = React.useRef(0);
  const attachmentVersionRef = React.useRef(0);
  const [registeredContext, setRegisteredContext] = React.useState<{
    token: symbol; identity: string; context: AvailableScreenContext;
  } | null>(null);
  const availableContext = authorized && registeredContext?.identity === identityKey ? registeredContext.context : null;
  const registerScreenContext = React.useCallback((context: AvailableScreenContext) => {
    if (!authorized) return () => {};
    const token = Symbol("screen-context");
    setRegisteredContext({ token, identity: identityKey, context: { label: context.label, reference: { ...context.reference } } });
    return () => setRegisteredContext(current => current?.token === token ? null : current);
  }, [authorized, identityKey]);
  const operationControllers = React.useRef(new Map<string, AbortController>());
  const inFlightTurnRef = React.useRef(false);
  const memoryOperationIdsRef = React.useRef(new Set<string>());
  const memorySettingsRequestRef = React.useRef(0);
  const memoryMutationInFlightRef = React.useRef(false);
  const [state, setReactState] = React.useState(() => derive(INITIAL_STATE, null));
  const stateIdentityRef = React.useRef(identityKey);
  const renderState = stateIdentityRef.current === identityKey ? state : INITIAL_STATE;
  const stateRef = React.useRef(renderState);
  stateRef.current = renderState;

  const patch = React.useCallback((updates: Partial<CompanionState> | ((current: CompanionState) => Partial<CompanionState>)) => {
    const current = stateRef.current;
    const delta = typeof updates === "function" ? updates(current) : updates;
    const next = derive({ ...current, ...delta }, pendingTurnRef.current);
    stateRef.current = next;
    setReactState(next);
  }, []);

  const attachAvailableContext = React.useCallback(() => {
    if (!authorizedRef.current || !availableContext || stateRef.current.attachedContext) return;
    if (!stateRef.current.draft) {
      draftOriginRef.current = stateRef.current.mode === "conversation"
        ? stateRef.current.activeConversation?.id ?? (firstRequestRef.current ? "first:" + firstRequestRef.current.turnId : null)
        : null;
    }
    attachmentVersionRef.current += 1;
    patch({ attachedContext: { label: availableContext.label, reference: { ...availableContext.reference } } });
  }, [availableContext, patch]);

  const removeAttachedContext = React.useCallback(() => {
    attachmentVersionRef.current += 1;
    patch({ attachedContext: null });
  }, [patch]);

  const isCurrent = React.useCallback((identity: string) => identityRef.current === identity && authorizedRef.current, []);

  const beginOperation = React.useCallback((key: string) => {
    operationControllers.current.get(key)?.abort();
    const controller = new AbortController();
    operationControllers.current.set(key, controller);
    return controller;
  }, []);

  React.useLayoutEffect(() => {
    for (const controller of operationControllers.current.values()) controller.abort();
    operationControllers.current.clear();
    turnControllerRef.current?.abort();
    turnControllerRef.current = null;
    turnIdentityRef.current = null;
    firstRequestRef.current = null;
    draftOriginRef.current = null;
    stateIdentityRef.current = identityKey;
    inFlightTurnRef.current = false;
    pendingTurnRef.current = null;
    memoryOperationIdsRef.current.clear();
    memorySettingsRequestRef.current += 1;
    memoryMutationInFlightRef.current = false;
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

  const discardDraftForSwitch = React.useCallback(() => {
    if ((stateRef.current.draft || stateRef.current.attachedContext)
      && !window.confirm("Bạn có muốn bỏ bản nháp và ngữ cảnh hiện tại để chuyển cuộc trò chuyện? Chọn Hủy để giữ lại.")) return false;
    draftVersionRef.current += 1;
    attachmentVersionRef.current += 1;
    draftOriginRef.current = null;
    patch({ draft: "", attachedContext: null });
    return true;
  }, [patch]);

  const openConversation = React.useCallback(async (item: CompanionConversation | string) => {
    const identity = identityRef.current;
    if (!isCurrent(identity) || inFlightTurnRef.current || firstRequestRef.current) return;
    const conversationId = typeof item === "string" ? item : item.id;
    if ((stateRef.current.draft || stateRef.current.attachedContext)
      && draftOriginRef.current !== conversationId && !discardDraftForSwitch()) return;
    operationControllers.current.get("messages-older")?.abort();
    const controller = beginOperation("messages");
    const known = typeof item === "string" ? null : item;
    if (stateRef.current.activeConversation?.id !== conversationId) {
      attachmentVersionRef.current += 1;
      patch({ attachedContext: null });
    }
    patch({
      mode: "conversation", activeConversation: known, messages: [], messagesBeforeSequence: null,
      hasOlderMessages: false, isMessagesLoading: true, error: null, retryAvailable: false, partialText: "", incomplete: false, statusCode: null,
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
  }, [beginOperation, discardDraftForSwitch, isCurrent, patch]);

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

  const startNewConversation = React.useCallback(() => {
    if (!authorizedRef.current || inFlightTurnRef.current || firstRequestRef.current) return;
    if (stateRef.current.mode === "conversation" && !stateRef.current.activeConversation) return;
    if (!discardDraftForSwitch()) return;
    operationControllers.current.get("messages")?.abort();
    operationControllers.current.get("messages-older")?.abort();
    pendingTurnRef.current = null;
    patch({ mode: "conversation", activeConversation: null, messages: [], messagesBeforeSequence: null,
      hasOlderMessages: false, isMessagesLoading: false, retryAvailable: false, partialText: "",
      incomplete: false, statusCode: null, error: null });
  }, [discardDraftForSwitch, patch]);
  const deleteConversation = React.useCallback(async (conversationId: string) => {
    const identity = identityRef.current;
    if (!isCurrent(identity) || inFlightTurnRef.current || firstRequestRef.current) return;
    const controller = beginOperation("delete");
    patch({ error: null });
    try {
      await companionService.deleteConversation(conversationId, controller.signal);
      if (!controller.signal.aborted && isCurrent(identity)) {
        if (pendingTurnRef.current?.conversationId === conversationId) pendingTurnRef.current = null;
        if (stateRef.current.activeConversation?.id === conversationId) {
          attachmentVersionRef.current += 1;
          patch({ attachedContext: null });
        }
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

  const acceptFirst = React.useCallback((request: FirstRequest, status: FirstTurnStatus) => {
    if (!isCurrent(request.identity) || firstRequestRef.current !== request || status.turnId !== request.turnId
      || !status.conversation || !status.userMessage || status.userMessage.content !== request.content) return false;
    const updates: Partial<CompanionState> = {};
    if (!request.admitted) {
      request.admitted = true;
      if (draftVersionRef.current === request.draftVersion && stateRef.current.draft === request.content) updates.draft = "";
      if (attachmentVersionRef.current === request.attachmentVersion && request.context) updates.attachedContext = null;
      if (draftOriginRef.current === "first:" + request.turnId) draftOriginRef.current = status.conversation.id;
      void loadHome();
    }
    pendingTurnRef.current = {
      conversationId: status.conversation.id, turnId: request.turnId, content: request.content,
      screenContext: request.context, baselineMessageCount: 0, retryAvailable: false,
    };
    patch({ ...updates, pendingQuestion: null, activeConversation: status.conversation,
      messages: status.assistantMessage ? [status.userMessage, status.assistantMessage] : [status.userMessage],
      messagesBeforeSequence: null, hasOlderMessages: false });
    return true;
  }, [isCurrent, loadHome, patch]);

  const resolveFirst = React.useCallback(async (request: FirstRequest, cancel: boolean) => {
    if (!isCurrent(request.identity) || firstRequestRef.current !== request) return;
    const controller = beginOperation("first-status");
    patch({ stream: "reconciling", isSending: false });
    try {
      const status = await companionService.getFirstTurn(request.turnId, cancel, controller.signal);
      if (controller.signal.aborted || !isCurrent(request.identity) || firstRequestRef.current !== request) return;
      if (status.state === "CANCELLED" || status.state === "DELETED") {
        firstRequestRef.current = null;
        pendingTurnRef.current = null;
        if (draftOriginRef.current === "first:" + request.turnId) draftOriginRef.current = null;
        patch({ firstAdmissionPending: false, pendingQuestion: null, activeConversation: null, messages: [],
          stream: "idle", isSending: false, partialText: "", incomplete: false, retryAvailable: false,
          statusCode: null, error: status.state === "CANCELLED"
            ? "Đã hủy trước khi gửi. Bạn có thể tiếp tục chỉnh sửa bản nháp."
            : "Cuộc trò chuyện đã được tạo trước đó nhưng không còn tồn tại." });
        return;
      }
      if (!acceptFirst(request, status)) {
        patch({ stream: "idle", isSending: false, error: "Không thể xác nhận đúng yêu cầu đầu tiên. Hãy kiểm tra lại." });
        return;
      }
      if (status.state === "ACTIVE") {
        patch({ stream: "idle", isSending: false, error: "Tin nhắn đã được nhận; chưa xác nhận được kết quả. Hãy kiểm tra lại." });
        return;
      }
      if (status.conversation && status.conversation.messageCount > (status.assistantMessage ? 2 : 1)) {
        const page = await companionService.listMessages(status.conversation.id, 20, undefined, controller.signal);
        if (controller.signal.aborted || !isCurrent(request.identity) || firstRequestRef.current !== request) return;
        patch({ messages: page.items, messagesBeforeSequence: page.nextBeforeSequence, hasOlderMessages: page.nextBeforeSequence !== null });
      }
      const canRetry = status.state === "INCOMPLETE" && status.retryEligible && request.retryable;
      pendingTurnRef.current = canRetry && pendingTurnRef.current ? { ...pendingTurnRef.current, retryAvailable: true } : null;
      firstRequestRef.current = null;
      patch({ firstAdmissionPending: false, stream: "idle", isSending: false,
        retryAvailable: canRetry, partialText: status.state === "COMPLETED" ? "" : stateRef.current.partialText, incomplete: status.state === "INCOMPLETE" && !!stateRef.current.partialText, statusCode: null,
        error: status.state === "COMPLETED" ? null : "Tin nhắn đã được ghi nhận nhưng phản hồi chưa hoàn tất." });
      void loadHome();
    } catch {
      if (!controller.signal.aborted && isCurrent(request.identity) && firstRequestRef.current === request) {
        patch({ firstAdmissionPending: true, stream: "idle", isSending: false,
          error: "Chưa xác nhận được yêu cầu. Kiểm tra lại hoặc hủy nếu chưa được nhận." });
      }
    } finally {
      if (operationControllers.current.get("first-status") === controller) operationControllers.current.delete("first-status");
    }
  }, [acceptFirst, beginOperation, isCurrent, loadHome, patch]);

  const checkFirstAdmission = React.useCallback(async (cancel: boolean) => {
    const request = firstRequestRef.current;
    if (!request || inFlightTurnRef.current || !isCurrent(request.identity)) return;
    inFlightTurnRef.current = true;
    try {
      await resolveFirst(request, cancel);
    } finally {
      if (isCurrent(request.identity)) inFlightTurnRef.current = false;
    }
  }, [isCurrent, resolveFirst]);

  const startFirstTurn = React.useCallback(async () => {
    if (inFlightTurnRef.current || firstRequestRef.current || !authorizedRef.current) return;
    const current = stateRef.current;
    if (!current.canSubmit || !current.draft.trim()) return;
    if (current.mode === "home" && draftOriginRef.current && (current.draft || current.attachedContext)
      && !window.confirm("Bản nháp thuộc cuộc trò chuyện trước. Gửi bản nháp và ngữ cảnh này trong một cuộc trò chuyện mới độc lập?")) return;
    if (!globalThis.crypto?.randomUUID) {
      patch({ error: "Không thể tạo mã yêu cầu an toàn." });
      return;
    }
    const request: FirstRequest = {
      identity: identityRef.current, turnId: globalThis.crypto.randomUUID(), content: current.draft,
      context: current.attachedContext ? { ...current.attachedContext.reference } : undefined,
      draftVersion: draftVersionRef.current, attachmentVersion: attachmentVersionRef.current,
      retryable: false, admitted: false,
    };
    firstRequestRef.current = request;
    draftOriginRef.current = "first:" + request.turnId;
    inFlightTurnRef.current = true;
    pendingTurnRef.current = null;
    operationControllers.current.get("messages")?.abort();
    operationControllers.current.get("messages-older")?.abort();
    const controller = new AbortController();
    turnControllerRef.current = controller;
    patch({ mode: "conversation", activeConversation: null, messages: [], messagesBeforeSequence: null,
      hasOlderMessages: false, isMessagesLoading: false, firstAdmissionPending: true, isSending: true,
      pendingQuestion: { turnId: request.turnId, content: request.content, contextLabel: current.attachedContext?.label },
      stream: "connecting", error: null, statusCode: null, partialText: "", incomplete: false, retryAvailable: false });
    try {
      await streamCompanionTurn(null, { turnId: request.turnId, content: request.content, retry: false,
        ...(request.context ? { screenContext: request.context } : {}) }, controller.signal, (event) => {
        if (!isCurrent(request.identity) || firstRequestRef.current !== request || controller.signal.aborted) return;
        if (event.event === "admitted") {
          if (!request.admitted && acceptFirst(request, event.data)) patch({ stream: "streaming" });
          return;
        }
        if (!request.admitted) return;
        if (event.event === "delta") {
          patch(value => ({ stream: "streaming", statusCode: null, partialText: value.partialText + event.data.text }));
        } else if (event.event === "status" && event.data.code === "ASSESSMENT_LOOKUP") {
          patch({ statusCode: "ASSESSMENT_LOOKUP" });
        } else if (event.event === "memory_operation" && !memoryOperationIdsRef.current.has(event.data.operationId)) {
          memoryOperationIdsRef.current.add(event.data.operationId);
          const conversationId = pendingTurnRef.current?.conversationId;
          if (conversationId) {
            const operation: CompanionMemoryOperationReceipt = { ...event.data, conversationId };
            patch(value => ({ memoryOperations: [...value.memoryOperations, operation].slice(-20) }));
          }
        } else if (event.event === "error" && event.data.turnId === request.turnId) {
          request.retryable = event.data.retryable;
          patch({ error: event.data.detail, statusCode: null });
        } else if (event.event === "completed" && event.data.turnId === request.turnId) {
          const assistant = event.data.assistantMessage;
          patch(value => ({
            messages: value.messages.some(message => message.id === assistant.id) ? value.messages : [...value.messages, assistant],
            activeConversation: value.activeConversation ? { ...value.activeConversation,
              messageCount: event.data.messageCount, maxMessages: event.data.maxMessages } : null,
            partialText: "", statusCode: null, stream: "idle", isSending: false,
          }));
        }
      });
    } catch (error) {
      if (isCurrent(request.identity) && !controller.signal.aborted) {
        const problem = toCompanionApiError(error);
        request.retryable = problem.code === "STREAM_CAPACITY_EXCEEDED";
        const knownRejected = !request.admitted && ([400, 401, 403, 429].includes(problem.status ?? 0)
          || problem.code === "MESSAGE_LIMIT_REACHED" || problem.code === "FIRST_TURN_PAYLOAD_CONFLICT");
        if (knownRejected) {
          firstRequestRef.current = null;
          pendingTurnRef.current = null;
          if (draftOriginRef.current === "first:" + request.turnId) draftOriginRef.current = null;
          patch({ firstAdmissionPending: false, pendingQuestion: null, stream: "idle", isSending: false, error: problem.message });
        }
      }
    } finally {
      if (isCurrent(request.identity) && firstRequestRef.current === request) {
        await resolveFirst(request, controller.signal.aborted);
      }
      if (turnControllerRef.current === controller) turnControllerRef.current = null;
      if (isCurrent(request.identity)) {
        inFlightTurnRef.current = false;
        void loadQuota(request.identity);
      }
    }
  }, [acceptFirst, isCurrent, loadQuota, patch, resolveFirst]);

  const startTurn = React.useCallback(async (retry: boolean) => {
    if (inFlightTurnRef.current || firstRequestRef.current || !authorizedRef.current) return;
    if (!retry && (stateRef.current.mode === "home" || !stateRef.current.activeConversation)) {
      await startFirstTurn();
      return;
    }
    const identity = identityRef.current;
    let turn = retry ? pendingTurnRef.current : null;
    const originalDraft = stateRef.current.draft;
    const submittedDraftVersion = draftVersionRef.current;
    const originalAttachment = stateRef.current.attachedContext;
    const submittedAttachmentVersion = attachmentVersionRef.current;
    const clearSubmittedDraft = () => {
      if (retry) return;
      const updates: Partial<CompanionState> = {};
      if (stateRef.current.draft === originalDraft && draftVersionRef.current === submittedDraftVersion) updates.draft = "";
      if (originalAttachment && attachmentVersionRef.current === submittedAttachmentVersion) updates.attachedContext = null;
      patch(updates);
    };
    if (retry && (!turn || !turn.retryAvailable || turn.conversationId !== stateRef.current.activeConversation?.id)) return;
    if (!retry && !originalDraft.trim()) return;
    inFlightTurnRef.current = true;
    turnIdentityRef.current = identity;
    patch({ isSending: true, stream: "connecting", error: null, statusCode: null, partialText: "", incomplete: false, retryAvailable: false });
    const conversation = stateRef.current.activeConversation;
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
        screenContext: originalAttachment ? { ...originalAttachment.reference } : undefined,
        baselineMessageCount: conversation.messageCount,
        retryAvailable: false,
      };
      pendingTurnRef.current = turn;
    }

    if (!retry) {
      patch({ pendingQuestion: { turnId: turn.turnId, content: originalDraft, contextLabel: originalAttachment?.label } });
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
        ...(turn.screenContext ? { screenContext: turn.screenContext } : {}),
      }, controller.signal, (event: CompanionTurnEvent) => {
        if (!isCurrent(identity) || controller.signal.aborted) return;
        if (event.event === "delta") {
          patch((current) => ({ stream: "streaming", statusCode: null, partialText: current.partialText + event.data.text }));
        } else if (event.event === "status") {
          if (event.data.code === "ASSESSMENT_LOOKUP") patch({ statusCode: "ASSESSMENT_LOOKUP" });
        } else if (event.event === "memory_operation") {
          if (!memoryOperationIdsRef.current.has(event.data.operationId)) {
            memoryOperationIdsRef.current.add(event.data.operationId);
            const operation: CompanionMemoryOperationReceipt = { ...event.data, conversationId: turn?.conversationId ?? conversation?.id ?? "" };
            patch((current) => ({ memoryOperations: [...current.memoryOperations, operation].slice(-20) }));
          }
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
        if (isCurrent(identity) && !controller.signal.aborted) {
          clearSubmittedDraft();
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
              pendingQuestion: null,
              messages: current.messages.some((message) => message.id === userMessage.id)
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
      if (isCurrent(identity)) patch({ pendingQuestion: null, stream: "idle", isSending: false, incomplete: !terminal && Boolean(stateRef.current.partialText) });
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
          if (malformedSuccess && confirmed) clearSubmittedDraft();
        } else {
          pendingTurnRef.current = null;
          patch({ error: apiError.message, retryAvailable: false });
        }
        if (isCurrent(identity)) patch({ pendingQuestion: null, stream: "idle", isSending: false, incomplete: Boolean(stateRef.current.partialText) });
      }
    } finally {
      if (turnControllerRef.current === controller) turnControllerRef.current = null;
      if (turnIdentityRef.current === identity) {
        inFlightTurnRef.current = false;
        turnIdentityRef.current = null;
      }
    }
  }, [isCurrent, loadHome, loadQuota, patch, reconcile, startFirstTurn]);

  const loadMemories = React.useCallback(async (category: CompanionMemoryCategory | "ALL" = "ALL", before?: string) => {
    const identity = identityRef.current;
    if (!isCurrent(identity)) return;
    const controller = beginOperation("memories");
    patch({ memoryLoading: true, memoryError: null, ...(before ? {} : { memoryCategory: category, memoryCursor: null }) });
    try {
      const page = await companionService.listMemories(category === "ALL" ? undefined : category, before, controller.signal);
      if (!controller.signal.aborted && isCurrent(identity)) patch((current) => ({
        memories: before ? [...current.memories, ...page.items] : page.items,
        memoryCursor: page.nextCursor,
        memoryCategory: category,
      }));
    } catch (error) {
      if (!controller.signal.aborted && isCurrent(identity)) patch({ memoryError: toCompanionApiError(error).message });
    } finally {
      if (operationControllers.current.get("memories") === controller) operationControllers.current.delete("memories");
      if (!controller.signal.aborted && isCurrent(identity)) patch({ memoryLoading: false });
    }
  }, [beginOperation, isCurrent, patch]);

  const loadMemorySettings = React.useCallback(async () => {
    const identity = identityRef.current;
    if (!isCurrent(identity)) return;
    const requestSequence = ++memorySettingsRequestRef.current;
    const controller = beginOperation("memory-settings");
    patch({ memorySettingsLoading: true, memoryError: null });
    try {
      const settings = await companionService.getMemorySettings(controller.signal);
      if (!controller.signal.aborted && isCurrent(identity) && memorySettingsRequestRef.current === requestSequence) patch({ automaticMemoryEnabled: settings.automaticMemoryEnabled });
    } catch (error) {
      if (!controller.signal.aborted && isCurrent(identity)) patch({ memoryError: toCompanionApiError(error).message });
    } finally {
      if (operationControllers.current.get("memory-settings") === controller) operationControllers.current.delete("memory-settings");
      if (!controller.signal.aborted && isCurrent(identity) && memorySettingsRequestRef.current === requestSequence) patch({ memorySettingsLoading: false });
    }
  }, [beginOperation, isCurrent, patch]);

  const updateMemory = React.useCallback(async (memory: CompanionMemory, content: string) => {
    const identity = identityRef.current;
    if (!isCurrent(identity) || memoryMutationInFlightRef.current) return false;
    memoryMutationInFlightRef.current = true;
    const controller = beginOperation("memory-mutation");
    patch({ memoryError: null, memoryMutationLoading: true });
    try {
      const updated = await companionService.updateMemory(memory, content, controller.signal);
      if (!controller.signal.aborted && isCurrent(identity)) patch((current) => ({
        memories: current.memories.map((item) => item.id === updated.id ? updated : item),
      }));
      return !controller.signal.aborted && isCurrent(identity);
    } catch (error) {
      if (!controller.signal.aborted && isCurrent(identity)) patch({ memoryError: toCompanionApiError(error).message });
      return false;
    } finally {
      if (operationControllers.current.get("memory-mutation") === controller) {
        operationControllers.current.delete("memory-mutation");
        memoryMutationInFlightRef.current = false;
        if (isCurrent(identity)) patch({ memoryMutationLoading: false });
      }
    }
  }, [beginOperation, isCurrent, patch]);

  const forgetMemory = React.useCallback(async (memory: CompanionMemory) => {
    const identity = identityRef.current;
    if (!isCurrent(identity) || memoryMutationInFlightRef.current) return;
    memoryMutationInFlightRef.current = true;
    const controller = beginOperation("memory-mutation");
    patch({ memoryError: null, memoryMutationLoading: true });
    try {
      await companionService.deleteMemory(memory, controller.signal);
      if (!controller.signal.aborted && isCurrent(identity)) patch((current) => ({
        memories: current.memories.filter((item) => item.id !== memory.id),
      }));
    } catch (error) {
      if (!controller.signal.aborted && isCurrent(identity)) patch({ memoryError: toCompanionApiError(error).message });
    } finally {
      if (operationControllers.current.get("memory-mutation") === controller) {
        operationControllers.current.delete("memory-mutation");
        memoryMutationInFlightRef.current = false;
        if (isCurrent(identity)) patch({ memoryMutationLoading: false });
      }
    }
  }, [beginOperation, isCurrent, patch]);

  const setAutomaticMemoryEnabled = React.useCallback(async (enabled: boolean) => {
    const identity = identityRef.current;
    if (!isCurrent(identity)) return;
    const requestSequence = ++memorySettingsRequestRef.current;
    operationControllers.current.get("memory-settings")?.abort();
    const controller = beginOperation("memory-settings-save");
    patch({ memorySettingsLoading: true, memoryError: null });
    try {
      const settings = await companionService.setMemorySettings(enabled, controller.signal);
      if (!controller.signal.aborted && isCurrent(identity) && memorySettingsRequestRef.current === requestSequence) patch({ automaticMemoryEnabled: settings.automaticMemoryEnabled });
    } catch (error) {
      if (!controller.signal.aborted && isCurrent(identity)) patch({ memoryError: toCompanionApiError(error).message });
    } finally {
      if (operationControllers.current.get("memory-settings-save") === controller) operationControllers.current.delete("memory-settings-save");
      if (!controller.signal.aborted && isCurrent(identity) && memorySettingsRequestRef.current === requestSequence) patch({ memorySettingsLoading: false });
    }
  }, [beginOperation, isCurrent, patch]);

  const setMode = React.useCallback((mode: CompanionMode) => {
    patch({ mode });
    if (mode === "home") void loadHome();
    if (mode === "history") void loadHistory();
    if (mode === "memory") void loadMemories(stateRef.current.memoryCategory);
    if (mode === "settings") void loadMemorySettings();
  }, [loadHistory, loadHome, loadMemories, loadMemorySettings, patch]);

  const openPanel = React.useCallback(() => {
    if (!authorizedRef.current) return;
    patch({ panelOpen: true, panelMinimized: false });
    void loadHome();
  }, [loadHome, patch]);

  const closePanel = React.useCallback(() => patch({ panelOpen: false }), [patch]);
  const minimizePanel = React.useCallback(() => patch({ panelMinimized: true }), [patch]);
  const setDraft = React.useCallback((draft: string) => {
    if (!stateRef.current.draft && !stateRef.current.attachedContext && draft) {
      draftOriginRef.current = stateRef.current.mode === "conversation"
        ? stateRef.current.activeConversation?.id ?? (firstRequestRef.current ? "first:" + firstRequestRef.current.turnId : null)
        : null;
    }
    if (!draft && !stateRef.current.attachedContext) draftOriginRef.current = null;
    draftVersionRef.current += 1;
    patch({ draft });
  }, [patch]);
  const submitTurn = React.useCallback(() => startTurn(false), [startTurn]);
  const retryTurn = React.useCallback(() => startTurn(true), [startTurn]);
  const stopTurn = React.useCallback(() => {
    const controller = turnControllerRef.current;
    if (controller && firstRequestRef.current) {
      controller.abort();
      patch({ isSending: false, stream: "reconciling", statusCode: null });
      return;
    }
    const turn = pendingTurnRef.current;
    if (!controller || !turn) return;
    controller.abort();
    pendingTurnRef.current = { ...turn, retryAvailable: false };
    patch({ isSending: false, stream: "reconciling", statusCode: null, incomplete: Boolean(stateRef.current.partialText) });
    const identity = identityRef.current;
    const reconciliationController = new AbortController();
    void reconcile(pendingTurnRef.current, identity, reconciliationController, false, "STOPPED").then(() => {
      if (isCurrent(identity)) patch({ pendingQuestion: null, stream: "idle", isSending: false });
    });
  }, [isCurrent, patch, reconcile]);

  const contextValue = React.useMemo<CompanionContextValue>(() => ({
    state: renderState,
    availableContext,
    registerScreenContext,
    attachAvailableContext,
    removeAttachedContext,
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
    startNewConversation,
    checkFirstAdmission,
    deleteConversation,
    submitTurn,
    retryTurn,
    stopTurn,
    refreshQuota: loadQuota,
    loadMemories,
    updateMemory,
    forgetMemory,
    setAutomaticMemoryEnabled,
  }), [renderState, availableContext, registerScreenContext, attachAvailableContext, removeAttachedContext, openPanel, closePanel, minimizePanel, setMode, setDraft, loadHome, loadHistory, loadMoreHistory,
    openConversation, loadOlderMessages, startNewConversation, checkFirstAdmission, deleteConversation, submitTurn, retryTurn, stopTurn, loadQuota,
    loadMemories, updateMemory, forgetMemory, setAutomaticMemoryEnabled]);

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
