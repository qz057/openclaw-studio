import { useEffect, useState } from "react";
import {
  createOpenClawChatSession,
  loadHermesGatewayServiceState,
  loadOpenClawChatState,
  loadOpenClawGatewayServiceState,
  loadOpenClawModelCatalog,
  sendOpenClawChatTurn,
  setOpenClawModel,
  startOpenClawGatewayService,
  stopOpenClawGatewayService
} from "@openclaw/bridge";
import type { StudioGatewayServiceState, StudioModelCatalog, StudioOpenClawChatMessage, StudioOpenClawChatState } from "@openclaw/shared";
import {
  ChatPanel,
  ComposerBar,
  ContextTokenCard,
  ConversationShell,
  GatewayControlCard,
  LatencyTrendCard,
  MessageBubble as ConversationMessageBubble,
  MessageTimeline,
  ModelRouteCard,
  SessionActionsCard,
  type ConversationChip,
  type ConversationNavTarget,
  type ConversationSurfaceId,
  type ConversationThemeMode
} from "../components/conversation/ConversationShell";

interface ChatPageProps {
  bridgeStatus: string;
  runtimeStatus: string;
  workspaceLabel: string;
  readinessLabel: string;
  gatewayStatus: string;
  networkStatus: string;
  onNavigatePage?: (pageId: ConversationNavTarget) => void;
  onSessionSurfaceChange?: (surface: ConversationSurfaceId) => void;
  themeMode?: ConversationThemeMode;
  onThemeModeChange?: (mode: ConversationThemeMode) => void;
}

interface PersistedChatState {
  draft: string;
}

interface FreshSessionState {
  startedAt: string | null;
  sessionId: string | null;
  sessionKey: string | null;
}

interface LocalChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  deliveryStatus?: "pending" | "failed";
  clientTurnId?: string;
}

interface DisplayChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  source: "remote" | "local";
  deliveryStatus?: "pending" | "failed";
}

interface OperationResultState {
  status: "success" | "error" | "info";
  summary: string;
  nextStep: string;
  updatedAt: number;
  detail?: string | null;
}

const promptPresets = [
  "总结当前 OpenClaw 运行状态",
  "检查最近会话和待处理事项",
  "告诉我现在最值得继续的下一步",
  "帮我诊断当前工作区里最明显的问题"
];

const CHAT_STORAGE_KEY = "openclaw-studio.chat-page.v2";
const CHAT_FRESH_SESSION_STORAGE_KEY = "openclaw-studio.chat-page.fresh-session";
const CHAT_REFRESH_INTERVAL_IDLE_MS = 4_000;
const CHAT_REFRESH_INTERVAL_ACTIVE_MS = 1_200;
const CHAT_GATEWAY_REFRESH_INTERVAL_MS = 5_000;
const CHAT_MODEL_REFRESH_INTERVAL_MS = 15_000;
const CHAT_THREAD_ID = "openclaw-studio-chat-thread";
const CHAT_AUTO_SCROLL_THRESHOLD_PX = 72;
const CHAT_GROUP_BREAK_MS = 5 * 60 * 1000;
const CHAT_TIME_SEPARATOR_BREAK_MS = 20 * 60 * 1000;

function getThreadElement(): HTMLDivElement | null {
  const thread = document.getElementById(CHAT_THREAD_ID);
  return thread instanceof HTMLDivElement ? thread : null;
}

function isNearLatest(thread: HTMLDivElement): boolean {
  const distanceFromBottom = thread.scrollHeight - thread.scrollTop - thread.clientHeight;
  return distanceFromBottom <= CHAT_AUTO_SCROLL_THRESHOLD_PX;
}

function readPersistedChatState(): PersistedChatState {
  if (typeof window === "undefined") {
    return { draft: "" };
  }

  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);

    if (!raw) {
      return { draft: "" };
    }

    const parsed = JSON.parse(raw) as PersistedChatState;
    return {
      draft: typeof parsed.draft === "string" ? parsed.draft : ""
    };
  } catch {
    return { draft: "" };
  }
}

function writePersistedChatState(state: PersistedChatState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(state));
}

function readFreshSessionState(): FreshSessionState {
  if (typeof window === "undefined") {
    return { startedAt: null, sessionId: null, sessionKey: null };
  }

  try {
    const raw = window.localStorage.getItem(CHAT_FRESH_SESSION_STORAGE_KEY);

    if (!raw) {
      return { startedAt: null, sessionId: null, sessionKey: null };
    }

    const parsed = JSON.parse(raw) as FreshSessionState;
    return {
      startedAt: typeof parsed.startedAt === "string" ? parsed.startedAt : null,
      sessionId: typeof parsed.sessionId === "string" ? parsed.sessionId : null,
      sessionKey: typeof parsed.sessionKey === "string" ? parsed.sessionKey : null
    };
  } catch {
    return { startedAt: null, sessionId: null, sessionKey: null };
  }
}

function writeFreshSessionState(state: FreshSessionState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CHAT_FRESH_SESSION_STORAGE_KEY, JSON.stringify(state));
}

function formatUpdatedAt(updatedAt: number | null): string {
  if (!updatedAt) {
    return "未同步";
  }

  const diffMs = Date.now() - updatedAt;

  if (diffMs < 60_000) {
    return "刚刚同步";
  }

  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 60) {
    return `${minutes} 分钟前同步`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours} 小时前同步`;
}

function formatGatewayStatus(state: StudioGatewayServiceState | null, fallback = "读取中"): string {
  if (!state) {
    return fallback;
  }

  if (/失败|不可用|未知|受限/i.test(state.statusLabel)) {
    return state.statusLabel;
  }

  if (state.running) {
    return "运行中";
  }

  return state.statusLabel || "待连接";
}

function formatGatewayHeaderStatus(state: StudioGatewayServiceState | null, fallback: string): string {
  if (!state) {
    return fallback;
  }

  if (!state.running) {
    return state.statusLabel || "待连接";
  }

  if (/失败|不可用|未知|受限/i.test(state.statusLabel)) {
    return `${state.statusLabel} ${typeof state.latencyMs === "number" ? `${state.latencyMs}ms` : ""}`.trim();
  }

  return typeof state.latencyMs === "number" ? `运行中 ${state.latencyMs}ms` : "运行中 · 已采样";
}

function formatGatewayLatency(state: StudioGatewayServiceState | null): string {
  if (!state) {
    return "读取中";
  }

  return typeof state.latencyMs === "number" ? `${state.latencyMs} ms` : "未采样";
}

function pickSelectedModelId(catalog: StudioModelCatalog, currentSelectedModelId: string): string {
  if (currentSelectedModelId && catalog.options.some((option) => option.id === currentSelectedModelId)) {
    return currentSelectedModelId;
  }

  return catalog.selectedModelId ?? catalog.options[0]?.id ?? "";
}

function formatMessageTimestamp(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    day: "2-digit"
  });
}

function formatTimelineSeparator(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function filterMessagesForFreshSession<T extends { timestamp: string }>(messages: T[], startedAt: string | null) {
  if (!startedAt) {
    return messages;
  }

  const startedAtMs = Date.parse(startedAt);

  if (!Number.isFinite(startedAtMs)) {
    return messages;
  }

  return messages.filter((message) => {
    const timestampMs = Date.parse(message.timestamp);
    return Number.isFinite(timestampMs) ? timestampMs >= startedAtMs : true;
  });
}

function shouldInsertTimeSeparator(previous: DisplayChatMessage | null, current: DisplayChatMessage) {
  if (!previous) {
    return true;
  }

  const previousTimestamp = Date.parse(previous.timestamp);
  const currentTimestamp = Date.parse(current.timestamp);

  if (!Number.isFinite(previousTimestamp) || !Number.isFinite(currentTimestamp)) {
    return false;
  }

  const previousDate = new Date(previousTimestamp);
  const currentDate = new Date(currentTimestamp);

  if (previousDate.toDateString() !== currentDate.toDateString()) {
    return true;
  }

  return currentTimestamp - previousTimestamp >= CHAT_TIME_SEPARATOR_BREAK_MS;
}

function shouldStartMessageGroup(previous: DisplayChatMessage | null, current: DisplayChatMessage) {
  if (!previous) {
    return true;
  }

  if (previous.role !== current.role) {
    return true;
  }

  if (previous.source !== current.source) {
    return true;
  }

  if (previous.deliveryStatus !== current.deliveryStatus) {
    return true;
  }

  const previousTimestamp = Date.parse(previous.timestamp);
  const currentTimestamp = Date.parse(current.timestamp);

  if (!Number.isFinite(previousTimestamp) || !Number.isFinite(currentTimestamp)) {
    return true;
  }

  return currentTimestamp - previousTimestamp >= CHAT_GROUP_BREAK_MS;
}

function mergeMessages(remoteMessages: StudioOpenClawChatMessage[], localMessages: LocalChatMessage[]): DisplayChatMessage[] {
  return [
    ...remoteMessages.map((message) => ({
      id: message.id,
      role: message.role,
      text: message.text,
      timestamp: message.timestamp,
      source: "remote" as const
    })),
    ...localMessages.map((message) => ({
      id: message.id,
      role: message.role,
      text: message.text,
      timestamp: message.timestamp,
      source: "local" as const,
      deliveryStatus: message.deliveryStatus
    }))
  ].sort((left, right) => {
    const leftTimestamp = Date.parse(left.timestamp);
    const rightTimestamp = Date.parse(right.timestamp);

    if (Number.isFinite(leftTimestamp) && Number.isFinite(rightTimestamp) && leftTimestamp !== rightTimestamp) {
      return leftTimestamp - rightTimestamp;
    }

    if (left.source !== right.source) {
      return left.source === "remote" ? -1 : 1;
    }

    return left.id.localeCompare(right.id);
  });
}

function normalizeComparableText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function remoteContainsLocalMessage(remoteMessages: StudioOpenClawChatMessage[], localMessage: Pick<LocalChatMessage, "role" | "text">): boolean {
  const target = normalizeComparableText(localMessage.text);

  if (!target) {
    return false;
  }

  return remoteMessages.some(
    (message) => message.role === localMessage.role && normalizeComparableText(message.text) === target
  );
}

function pruneSyncedLocalMessages(localMessages: LocalChatMessage[], remoteMessages: StudioOpenClawChatMessage[]): LocalChatMessage[] {
  if (remoteMessages.length === 0 || localMessages.length === 0) {
    return localMessages;
  }

  return localMessages.filter((message) => !remoteContainsLocalMessage(remoteMessages, message));
}

function resolveSelectedModelLabel(modelCatalog: StudioModelCatalog | null, selectedModelId: string): string {
  if (!selectedModelId) {
    return "未选择模型";
  }

  return modelCatalog?.options.find((option) => option.id === selectedModelId)?.label ?? selectedModelId;
}

function extractErrorMessage(cause: unknown, fallback: string): string {
  if (cause instanceof Error && cause.message.trim()) {
    return cause.message.trim();
  }

  const message = String(cause ?? "").trim();
  return message || fallback;
}

function buildOpenClawNextStep(scope: "gateway" | "model" | "send", detail: string): string {
  if (/command not found|not recognized|找不到/i.test(detail)) {
    return "在 WSL 里确认 openclaw CLI 已安装并加入 PATH，然后刷新状态。";
  }

  if (/timeout|timed out|超时/i.test(detail)) {
    return "先手动执行对应 CLI 命令，确认是否被网络、认证或后台服务阻塞。";
  }

  if (/permission|denied|权限/i.test(detail)) {
    return "检查 WSL 当前用户权限和配置文件权限，再用同一用户重试。";
  }

  if (scope === "gateway") {
    return "刷新网关状态；若 RPC 仍不可达，在 WSL 手动运行 openclaw gateway status --json 查看完整输出。";
  }

  if (scope === "model") {
    return "确认模型在 OpenClaw 配置中存在，再应用一次并发送短消息验证。";
  }

  return "确认网关、模型和会话状态均可用，然后点击重试发送。";
}

function createOperationResult(
  status: OperationResultState["status"],
  summary: string,
  nextStep: string,
  detail?: string | null
): OperationResultState {
  return {
    status,
    summary,
    detail,
    nextStep,
    updatedAt: Date.now()
  };
}

function CompactOperationResult({ label, result }: { label: string; result: OperationResultState | null }) {
  if (!result) {
    return null;
  }

  return (
    <div className={`conversation-result-note conversation-result-note--${result.status}`} title={result.detail ?? result.nextStep}>
      <span>{label}</span>
      <strong>{result.summary}</strong>
    </div>
  );
}

export function ChatPage({
  readinessLabel,
  gatewayStatus,
  onNavigatePage,
  onSessionSurfaceChange,
  themeMode,
  onThemeModeChange
}: ChatPageProps) {
  const persistedFreshSession = readFreshSessionState();
  const [draft, setDraft] = useState(() => readPersistedChatState().draft);
  const [chatState, setChatState] = useState<StudioOpenClawChatState | null>(null);
  const [messages, setMessages] = useState<StudioOpenClawChatMessage[]>([]);
  const [localMessages, setLocalMessages] = useState<LocalChatMessage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelCatalog, setModelCatalog] = useState<StudioModelCatalog | null>(null);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [applyingModel, setApplyingModel] = useState(false);
  const [gatewayServiceState, setGatewayServiceState] = useState<StudioGatewayServiceState | null>(null);
  const [hermesGatewayServiceState, setHermesGatewayServiceState] = useState<StudioGatewayServiceState | null>(null);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [gatewayBusy, setGatewayBusy] = useState(false);
  const [sendResult, setSendResult] = useState<OperationResultState | null>(null);
  const [modelResult, setModelResult] = useState<OperationResultState | null>(null);
  const [gatewayResult, setGatewayResult] = useState<OperationResultState | null>(null);
  const [freshSessionStartedAt, setFreshSessionStartedAt] = useState(() => persistedFreshSession.startedAt);
  const [freshSessionId, setFreshSessionId] = useState(() => persistedFreshSession.sessionId);
  const [freshSessionKey, setFreshSessionKey] = useState(() => persistedFreshSession.sessionKey);
  const [detachedFromLatest, setDetachedFromLatest] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const freshSessionActive = Boolean(freshSessionId);
  const displayMessages = mergeMessages(messages, localMessages);
  const unreadCount = detachedFromLatest ? Math.max(0, displayMessages.length - lastSeenCount) : 0;
  const firstUnreadIndex = unreadCount > 0 ? displayMessages.length - unreadCount : -1;
  const canSend = draft.trim().length > 0 && !submitting && Boolean(chatState?.canSend);
  const canApplyModel = selectedModelId.trim().length > 0 && !applyingModel && selectedModelId !== (modelCatalog?.selectedModelId ?? "");
  const composeHint = chatState?.canSend
    ? "下面输入，按 Ctrl/Cmd + Enter 直接发送到 OpenClaw。"
    : chatState?.disabledReason ?? "当前发送链路不可用。";
  const composeStatus = submitting ? "OpenClaw 正在回复…" : chatState?.readinessLabel ?? "检查发送链路";

  useEffect(() => {
    let cancelled = false;

    const refreshModelCatalog = async () => {
      try {
        console.log("[ChatPage] 开始加载模型列表...");
        const nextCatalog = await loadOpenClawModelCatalog();
        console.log("[ChatPage] 模型列表加载成功:", {
          selectedModelId: nextCatalog.selectedModelId,
          optionsCount: nextCatalog.options.length,
          options: nextCatalog.options.map(o => o.id)
        });

        if (cancelled) {
          return;
        }

        setModelCatalog(nextCatalog);
        setSelectedModelId((currentSelectedModelId) => pickSelectedModelId(nextCatalog, currentSelectedModelId));
      } catch (cause) {
        console.error("[ChatPage] 模型列表加载失败:", cause);
        if (!cancelled) {
          const detail = extractErrorMessage(cause, "加载模型选项失败。");
          setModelError(detail);
          setModelResult(createOperationResult("error", "模型列表加载未完成", buildOpenClawNextStep("model", detail), detail));
        }
      }
    };

    void refreshModelCatalog();
    const interval = window.setInterval(() => {
      void refreshModelCatalog();
    }, CHAT_MODEL_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [refreshNonce]);

  useEffect(() => {
    let cancelled = false;
    let refreshInFlight = false;

    const refreshGatewayState = async () => {
      if (refreshInFlight) {
        return;
      }

      refreshInFlight = true;

      try {
        const [openClawResult, hermesResult] = await Promise.allSettled([
          loadOpenClawGatewayServiceState(),
          loadHermesGatewayServiceState()
        ]);

        if (cancelled) {
          return;
        }

        if (openClawResult.status === "fulfilled") {
          setGatewayServiceState(openClawResult.value);
        } else {
          const detail = extractErrorMessage(openClawResult.reason, "加载 OpenClaw Gateway 状态失败。");
          setGatewayError(detail);
          setGatewayResult(createOperationResult("error", "网关状态读取未完成", buildOpenClawNextStep("gateway", detail), detail));
        }

        if (hermesResult.status === "fulfilled") {
          setHermesGatewayServiceState(hermesResult.value);
        }
      } catch (cause) {
        if (!cancelled) {
          const detail = extractErrorMessage(cause, "加载网关状态失败。");
          setGatewayError(detail);
          setGatewayResult(createOperationResult("error", "网关状态读取未完成", buildOpenClawNextStep("gateway", detail), detail));
        }
      } finally {
        refreshInFlight = false;
      }
    };

    void refreshGatewayState();
    const interval = window.setInterval(() => {
      void refreshGatewayState();
    }, CHAT_GATEWAY_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [refreshNonce]);

  useEffect(() => {
    writePersistedChatState({ draft });
  }, [draft]);

  useEffect(() => {
    writeFreshSessionState({
      startedAt: freshSessionStartedAt,
      sessionId: freshSessionId,
      sessionKey: freshSessionKey
    });
  }, [freshSessionId, freshSessionKey, freshSessionStartedAt]);

  useEffect(() => {
    const thread = getThreadElement();

    if (!thread) {
      return;
    }

    const updateStickiness = () => {
      const nextDetached = !isNearLatest(thread);
      thread.dataset.stickToLatest = nextDetached ? "false" : "true";
      setDetachedFromLatest(nextDetached);

      if (!nextDetached) {
        setLastSeenCount(displayMessages.length);
      }
    };

    if (thread.dataset.stickToLatest === "false") {
      updateStickiness();
    } else {
      thread.dataset.stickToLatest = "true";
      setDetachedFromLatest(false);
      setLastSeenCount(displayMessages.length);
    }

    thread.addEventListener("scroll", updateStickiness, { passive: true });

    return () => {
      thread.removeEventListener("scroll", updateStickiness);
    };
  }, [displayMessages.length]);

  useEffect(() => {
    if (!detachedFromLatest) {
      setLastSeenCount(displayMessages.length);
    }
  }, [detachedFromLatest, displayMessages.length]);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const thread = getThreadElement();
      const shouldStickToLatest = thread ? thread.dataset.stickToLatest !== "false" : true;

      try {
        if (cancelled) {
          return;
        }

        const nextState = await loadOpenClawChatState(freshSessionId);

        if (cancelled) {
          return;
        }

        setChatState(nextState);
        setMessages(nextState.messages);
        setLocalMessages((currentMessages) => pruneSyncedLocalMessages(currentMessages, nextState.messages));
        setLoading(false);

        window.requestAnimationFrame(() => {
          const nextThread = getThreadElement();

          if (nextThread && shouldStickToLatest) {
            nextThread.scrollTop = nextThread.scrollHeight;
            nextThread.dataset.stickToLatest = "true";
            setDetachedFromLatest(false);
          }
        });
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "加载聊天记录失败。");
          setLoading(false);
        }
      }
    };

    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, submitting ? CHAT_REFRESH_INTERVAL_ACTIVE_MS : CHAT_REFRESH_INTERVAL_IDLE_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [freshSessionId, refreshNonce, submitting]);

  async function submitPrompt(prompt: string, retryMessageId?: string) {
    const normalizedPrompt = prompt.trim();

    if (!normalizedPrompt || submitting) {
      return;
    }

    if (!chatState?.canSend) {
      const detail = chatState?.disabledReason ?? "当前发送链路不可用，无法发送到 OpenClaw。";
      setError(detail);
      setSendResult(createOperationResult("error", "OpenClaw 发送受阻", buildOpenClawNextStep("send", detail), detail));
      return;
    }

    const localMessageId = retryMessageId ?? `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const localMessageTimestamp = new Date().toISOString();

    const thread = getThreadElement();

    if (thread) {
      thread.dataset.stickToLatest = "true";
    }

    if (retryMessageId) {
      setLocalMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === retryMessageId
            ? {
                ...message,
                text: normalizedPrompt,
                timestamp: localMessageTimestamp,
                deliveryStatus: "pending"
              }
            : message
        )
      );
    } else {
      setLocalMessages((currentMessages) => [
        ...currentMessages,
        {
          id: localMessageId,
          role: "user",
          text: normalizedPrompt,
          timestamp: localMessageTimestamp,
          deliveryStatus: "pending"
        }
      ]);
      setDraft("");
    }

    setSubmitting(true);
    setError(null);
    setSendResult(createOperationResult("info", "正在发送到 OpenClaw", "等待当前回合返回，完成后会自动同步最新消息。", normalizedPrompt));

    try {
      const turnResult = await sendOpenClawChatTurn(normalizedPrompt, freshSessionId);
      const nextState = await loadOpenClawChatState(freshSessionId);
      const replyText = turnResult.reply.trim();
      const remoteHasPrompt = remoteContainsLocalMessage(nextState.messages, { role: "user", text: normalizedPrompt });
      const remoteHasReply = replyText ? remoteContainsLocalMessage(nextState.messages, { role: "assistant", text: replyText }) : true;

      setChatState(nextState);
      setMessages(nextState.messages);
      setLocalMessages((currentMessages) => {
        const withoutCurrentTurn = currentMessages.filter(
          (message) => message.id !== localMessageId && message.clientTurnId !== localMessageId
        );

        if (remoteHasPrompt && remoteHasReply) {
          return pruneSyncedLocalMessages(withoutCurrentTurn, nextState.messages);
        }

        const fallbackMessages: LocalChatMessage[] = [];

        if (!remoteHasPrompt) {
          fallbackMessages.push({
            id: localMessageId,
            role: "user",
            text: normalizedPrompt,
            timestamp: localMessageTimestamp,
            clientTurnId: localMessageId
          });
        }

        if (replyText && !remoteHasReply) {
          fallbackMessages.push({
            id: `${localMessageId}-assistant`,
            role: "assistant",
            text: replyText,
            timestamp: new Date().toISOString(),
            clientTurnId: localMessageId
          });
        }

        return pruneSyncedLocalMessages([...withoutCurrentTurn, ...fallbackMessages], nextState.messages);
      });
      setSendResult(
        createOperationResult(
          "success",
          "OpenClaw 发送完成",
          "查看最新回复；如果要验证模型切换，再发送一条短消息确认返回链路。",
          `${nextState.messages.length} 条消息已同步。`
        )
      );
    } catch (cause) {
      const detail = extractErrorMessage(cause, "发送聊天命令失败。");
      setLocalMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === localMessageId
            ? {
                ...message,
                deliveryStatus: "failed"
              }
            : message
        )
      );
      setDraft(normalizedPrompt);
      setError(detail);
      setSendResult(createOperationResult("error", "OpenClaw 发送未完成", buildOpenClawNextStep("send", detail), detail));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    await submitPrompt(draft);
  }

  async function handleRetryMessage(messageId: string) {
    const failedMessage = localMessages.find((message) => message.id === messageId);

    if (!failedMessage) {
      return;
    }

    await submitPrompt(failedMessage.text, messageId);
  }

  function handleJumpToLatest() {
    const thread = getThreadElement();

    if (!thread) {
      return;
    }

    thread.dataset.stickToLatest = "true";
    thread.scrollTop = thread.scrollHeight;
    setDetachedFromLatest(false);
    setLastSeenCount(displayMessages.length);
  }

  async function handleStartFreshSession() {
    const startedAt = new Date().toISOString();
    const nextSession = await createOpenClawChatSession();
    setFreshSessionStartedAt(startedAt);
    setFreshSessionId(nextSession.sessionId);
    setFreshSessionKey(nextSession.sessionKey);
    setMessages([]);
    setLocalMessages([]);
    setLastSeenCount(0);
    setDetachedFromLatest(false);
    setError(null);
    setDraft("");

    const thread = getThreadElement();

    if (thread) {
      thread.dataset.stickToLatest = "true";
      thread.scrollTop = 0;
    }
  }

  async function handleReturnToMainSession() {
    setFreshSessionStartedAt(null);
    setFreshSessionId(null);
    setFreshSessionKey(null);
    setLocalMessages([]);
    setLoading(true);
    const nextState = await loadOpenClawChatState(null);
    setChatState(nextState);
    setMessages(nextState.messages);
    setLoading(false);

    const thread = getThreadElement();

    if (thread) {
      thread.dataset.stickToLatest = "true";
      thread.scrollTop = thread.scrollHeight;
    }

    setDetachedFromLatest(false);
    setLastSeenCount(nextState.messages.length);
  }

  async function handleApplyModel() {
    if (!selectedModelId.trim() || applyingModel) {
      return;
    }

    setApplyingModel(true);
    setModelError(null);
    setModelResult(createOperationResult("info", "正在应用 OpenClaw 模型", "等待配置写入完成，完成后会刷新 OpenClaw 状态。", selectedModelId));

    try {
      const result = await setOpenClawModel(selectedModelId);

      setModelCatalog(result.catalog);
      setSelectedModelId(result.catalog.selectedModelId ?? result.catalog.options[0]?.id ?? selectedModelId);

      if (!result.applied) {
        const detail = result.error ?? "切换 OpenClaw 默认模型失败。";
        setModelError(detail);
        setModelResult(createOperationResult("error", "OpenClaw 模型应用未完成", buildOpenClawNextStep("model", detail), detail));
        return;
      }

      const nextState = await loadOpenClawChatState(freshSessionId);
      setChatState(nextState);
      setModelResult(
        createOperationResult(
          "success",
          "OpenClaw 模型已应用",
          "发送一条短消息验证新模型是否被当前会话采用。",
          result.catalog.selectedModelId ?? selectedModelId
        )
      );
    } catch (cause) {
      const detail = extractErrorMessage(cause, "切换 OpenClaw 默认模型失败。");
      setModelError(detail);
      setModelResult(createOperationResult("error", "OpenClaw 模型应用未完成", buildOpenClawNextStep("model", detail), detail));
    } finally {
      setApplyingModel(false);
    }
  }

  async function handleGatewayAction(action: "start" | "stop" | "refresh") {
    setGatewayBusy(action !== "refresh");
    setGatewayError(null);
    setGatewayResult(
      createOperationResult(
        "info",
        action === "refresh" ? "正在刷新 OpenClaw Gateway" : `正在${action === "start" ? "启动" : "停止"} OpenClaw Gateway`,
        "等待状态读取完成，最近结果会在这里更新。",
        gatewayServiceState?.detail ?? null
      )
    );

    try {
      if (action === "refresh") {
        const [nextState, nextHermesState] = await Promise.all([loadOpenClawGatewayServiceState(), loadHermesGatewayServiceState()]);
        setGatewayServiceState(nextState);
        setHermesGatewayServiceState(nextHermesState);
        setGatewayResult(
          createOperationResult(
            "success",
            "OpenClaw Gateway 状态已刷新",
            nextState.running ? "RPC 已可继续观察；需要维护时再停止网关。" : "如需发送真实请求，先启动网关。",
            `${nextState.detail} | Hermes: ${nextHermesState.detail}`
          )
        );
        return;
      }

      const result = action === "start" ? await startOpenClawGatewayService() : await stopOpenClawGatewayService();
      setGatewayServiceState(result.state);

      if (!result.applied) {
        const detail = result.error ?? `OpenClaw Gateway ${action === "start" ? "启动" : "停止"}失败。`;
        setGatewayError(detail);
        setGatewayResult(
          createOperationResult("error", `OpenClaw Gateway ${action === "start" ? "启动" : "停止"}未完成`, buildOpenClawNextStep("gateway", detail), detail)
        );
        return;
      }

      setGatewayResult(
        createOperationResult(
          "success",
          `OpenClaw Gateway 已${action === "start" ? "启动" : "停止"}`,
          result.state.running ? "现在可以发送 OpenClaw 消息或刷新 RPC 状态。" : "如需继续会话，重新启动网关后再发送。",
          result.state.detail
        )
      );
    } catch (cause) {
      const detail = extractErrorMessage(cause, `OpenClaw Gateway ${action === "start" ? "启动" : "停止"}失败。`);
      setGatewayError(detail);
      setGatewayResult(
        createOperationResult("error", `OpenClaw Gateway ${action === "start" ? "启动" : "停止"}未完成`, buildOpenClawNextStep("gateway", detail), detail)
      );
    } finally {
      setGatewayBusy(false);
    }
  }

  const selectedModelLabel = resolveSelectedModelLabel(modelCatalog, selectedModelId);
  const currentModelLabel = resolveSelectedModelLabel(modelCatalog, modelCatalog?.selectedModelId ?? "");
  const openClawGatewayStatus = formatGatewayStatus(gatewayServiceState);
  const hermesGatewayStatus = formatGatewayStatus(hermesGatewayServiceState);
  const openClawGatewayLatency = formatGatewayLatency(gatewayServiceState);
  const hermesGatewayLatency = formatGatewayLatency(hermesGatewayServiceState);
  const visibleModelLabel =
    chatState?.model && chatState?.provider
      ? `${chatState.model} · ${chatState.provider}`
      : selectedModelLabel !== "未选择模型"
        ? selectedModelLabel
        : chatState?.availability === "blocked"
          ? "发送链路不可用"
          : "等待识别模型";

  return (
    <section className="page chat-page chat-page--full">
      <ConversationShell
        activeSurface="openclaw"
        selectedSessionId="openclaw-main"
        onCreateSession={() => void handleStartFreshSession()}
        onNavigatePage={onNavigatePage}
        onSessionSurfaceChange={onSessionSurfaceChange}
        themeMode={themeMode}
        onThemeModeChange={onThemeModeChange}
        showGlobalNav={false}
        showSessionList={false}
        gatewaySummary={{
          openclaw: openClawGatewayStatus,
          hermes: hermesGatewayStatus,
          sampling: "2/2",
          host: "受保护",
          admin: "在线"
        }}
        header={{
          title: freshSessionActive ? "OpenClaw 新会话" : "OpenClaw",
          subtitle: visibleModelLabel,
          chips: [
            { label: "进行中", tone: "positive" },
            { label: formatGatewayHeaderStatus(gatewayServiceState, gatewayStatus), tone: gatewayServiceState?.running ? "positive" : "warning" },
            { label: formatUpdatedAt(chatState?.updatedAt ?? null), tone: "neutral" }
          ] as ConversationChip[],
          onCreateSession: () => void handleStartFreshSession(),
          onRefresh: () => {
            setRefreshNonce((value) => value + 1);
            void handleGatewayAction("refresh");
          }
        }}
        inspector={
          <>
            <ModelRouteCard
              title={modelCatalog?.options.length ? `${modelCatalog.options.length} 个可选模型` : "等待模型列表"}
              currentModel={currentModelLabel}
              secondaryModel="claude-opus-4-7"
              routeStrategy="自动路由 · 混合模式"
              result={<CompactOperationResult label="模型" result={modelResult} />}
            >
              <label className="conversation-select-field">
                <span>待应用模型</span>
                <select
                  value={selectedModelId}
                  disabled={applyingModel || (modelCatalog?.options.length ?? 0) === 0}
                  onChange={(event: { target: { value: string } }) => {
                    setSelectedModelId(event.target.value);
                  }}
                >
                  {modelCatalog?.options.length ? (
                    modelCatalog.options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))
                  ) : (
                    <option value="">未发现可用模型</option>
                  )}
                </select>
              </label>
              <div className="conversation-card-actions">
                <button type="button" onClick={() => void handleApplyModel()} disabled={!canApplyModel}>
                  {applyingModel ? "应用中..." : "应用模型"}
                </button>
              </div>
            </ModelRouteCard>

            <ContextTokenCard
              contextLabel="未采样"
              progress={0}
              rows={[
                { label: "输入令牌", value: "未采样" },
                { label: "输出令牌", value: "未采样" },
                { label: "缓存命中", value: "未采样" },
                { label: "数据来源", value: "运行时暂未暴露" }
              ]}
            />

            <GatewayControlCard
              openclawStatus={openClawGatewayStatus}
              hermesStatus={hermesGatewayStatus}
              openclawLatency={openClawGatewayLatency}
              hermesLatency={hermesGatewayLatency}
              result={<CompactOperationResult label="网关" result={gatewayResult} />}
            >
              <div className="conversation-card-actions">
                <button type="button" onClick={() => void handleGatewayAction("refresh")} disabled={gatewayBusy}>
                  刷新状态
                </button>
                <button type="button" onClick={() => void handleGatewayAction("start")} disabled={gatewayBusy || gatewayServiceState?.startAllowed === false}>
                  启动网关
                </button>
                <button
                  type="button"
                  className="conversation-card-actions__danger"
                  onClick={() => void handleGatewayAction("stop")}
                  disabled={gatewayBusy || gatewayServiceState?.stopAllowed === false}
                >
                  停止网关
                </button>
              </div>
            </GatewayControlCard>

            <SessionActionsCard
              status={composeStatus}
              canSendLabel={canSend ? "可发送" : "等待链路"}
              result={<CompactOperationResult label="发送" result={sendResult} />}
            >
              <div className="conversation-card-actions">
                {freshSessionActive ? (
                  <button type="button" onClick={() => void handleReturnToMainSession()}>
                    返回 OpenClaw
                  </button>
                ) : null}
                <button type="button" onClick={() => void handleStartFreshSession()}>
                  新建会话
                </button>
                <button type="button">导出对话</button>
                <button type="button" className="conversation-card-actions__danger">
                  结束会话
                </button>
              </div>
            </SessionActionsCard>
          </>
        }
      >
        <ChatPanel
          title="OpenClaw"
          subtitle={freshSessionActive ? freshSessionKey ?? "独立新会话" : chatState?.sessionKey ?? "agent:main:main"}
          statusChips={[
            { label: visibleModelLabel, tone: visibleModelLabel === "未选择模型" ? "warning" : "active" },
            { label: `本地网关 · ${openClawGatewayStatus}`, tone: gatewayServiceState?.running ? "positive" : "warning" },
            { label: `运行态 · ${chatState?.readinessLabel ?? readinessLabel}`, tone: chatState?.canSend ? "positive" : "warning" }
          ]}
          contextChips={[
            { label: "上下文统计 · 未采样", tone: "neutral" },
            { label: "工具调用 · 未采样", tone: "neutral" }
          ]}
          composer={
            <ComposerBar
              value={draft}
              placeholder="输入消息，按 Enter 发送，Shift + Enter 换行"
              disabled={!chatState?.canSend}
              canSend={canSend}
              submitting={submitting}
              submitLabel="发送到 OpenClaw"
              submittingLabel="发送中..."
              statusLabel={composeStatus}
              helperText={composeHint}
              presets={promptPresets}
              errors={[
                freshSessionActive ? "当前是独立新会话：后续消息不会写回 OpenClaw，只显示这个新会话里的内容。" : null,
                gatewayError,
                modelError,
                chatState?.disabledReason,
                error
              ]}
              onValueChange={setDraft}
              onSubmit={() => void handleSubmit()}
              onClear={() => setDraft("")}
              onPresetSelect={setDraft}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
            />
          }
        >
          <MessageTimeline
            threadId={CHAT_THREAD_ID}
            loading={loading}
            emptyTitle={freshSessionActive ? "OpenClaw 新会话已就绪" : "OpenClaw 还没有可显示的文本消息"}
            emptyDescription={
              freshSessionActive
                ? "现在只会显示你点击“新建会话”之后产生的新消息。"
                : "发送一条命令后，这里会直接出现 OpenClaw 的真实对话内容。"
            }
            detachedFromLatest={detachedFromLatest}
            onJumpToLatest={handleJumpToLatest}
          >
            {displayMessages.length > 0
              ? displayMessages.map((message: DisplayChatMessage, index: number) => {
                  const previous: DisplayChatMessage | null = index > 0 ? (displayMessages[index - 1] ?? null) : null;
                  const showTimeSeparator = shouldInsertTimeSeparator(previous, message);
                  const grouped = !shouldStartMessageGroup(previous, message);
                  const firstAssistantIndex = displayMessages.findIndex((item) => item.role === "assistant");

                  return (
                    <div key={message.id} className="conversation-timeline__item">
                      {showTimeSeparator ? (
                        <div className="conversation-time-separator">
                          <span>{formatTimelineSeparator(message.timestamp)}</span>
                        </div>
                      ) : null}
                      {firstUnreadIndex === index ? (
                        <div className="conversation-unread-marker">
                          <span>{unreadCount} 条新消息</span>
                        </div>
                      ) : null}
                      <ConversationMessageBubble
                        role={message.role}
                        roleLabel={message.role === "assistant" ? "OpenClaw" : "你"}
                        timeLabel={formatMessageTimestamp(message.timestamp)}
                        text={message.text}
                        grouped={grouped}
                        deliveryStatus={message.deliveryStatus}
                        onRetry={message.deliveryStatus === "failed" ? () => void handleRetryMessage(message.id) : undefined}
                      />
                      {firstAssistantIndex === index && gatewayServiceState?.lastCheckedAt ? (
                        <LatencyTrendCard
                          title="网关状态采样"
                          subtitle="最近一次"
                          value={openClawGatewayLatency}
                          sourceLabel={formatUpdatedAt(gatewayServiceState.lastCheckedAt)}
                        />
                      ) : null}
                    </div>
                  );
                })
              : null}
          </MessageTimeline>
        </ChatPanel>
      </ConversationShell>
    </section>
  );
}
