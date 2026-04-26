import { useEffect, useState } from "react";
import {
  createHermesSession,
  connectHermes,
  getHermesSessions,
  getHermesMessages,
  loadHermesGatewayServiceState,
  loadHermesModelCatalog,
  loadHermesState,
  disconnectHermes,
  subscribeToHermesEvents,
  sendHermesMessage,
  setHermesModel,
  startHermesGatewayService,
  stopHermesGatewayService
} from "@openclaw/bridge";
import type {
  StudioGatewayServiceState,
  StudioHermesMessage,
  StudioHermesSessionSummary,
  StudioHermesState,
  StudioModelCatalog
} from "@openclaw/shared";
import { OperationResultPanel, type OperationResultState } from "../components/OperationResultPanel";

interface HermesPageProps {
  bridgeStatus: string;
  runtimeStatus: string;
  workspaceLabel: string;
  readinessLabel: string;
  gatewayStatus: string;
  networkStatus: string;
}

interface PersistedHermesState {
  draft: string;
}

interface FreshSessionState {
  startedAt: string | null;
  sessionId: string | null;
  sessionKey: string | null;
}

interface LocalHermesMessage {
  id: string;
  role: "user";
  content: string;
  timestamp: string;
  deliveryStatus: "pending" | "failed";
}

interface DisplayHermesMessage {
  id: string;
  role: StudioHermesMessage["role"];
  content: string;
  timestamp: string | null;
  source: "remote" | "local";
  deliveryStatus?: "pending" | "failed";
}

const hermesPromptPresets = [
  "查看当前 Hermes 连接状态",
  "显示最近的 Hermes 会话",
  "检查 Hermes 网关配置",
  "诊断 Hermes 通信问题"
];

const HERMES_STORAGE_KEY = "openclaw-studio.hermes-page.v1";
const HERMES_FRESH_SESSION_STORAGE_KEY = "openclaw-studio.hermes-page.fresh-session";
const HERMES_REFRESH_INTERVAL_MS = 5_000;
const HERMES_THREAD_ID = "hermes-chat-thread";
const HERMES_AUTO_SCROLL_THRESHOLD_PX = 72;
const HERMES_GROUP_BREAK_MS = 5 * 60 * 1000;
const HERMES_TIME_SEPARATOR_BREAK_MS = 20 * 60 * 1000;

function getThreadElement(): HTMLDivElement | null {
  const thread = document.getElementById(HERMES_THREAD_ID);
  return thread instanceof HTMLDivElement ? thread : null;
}

function isNearLatest(thread: HTMLDivElement): boolean {
  const distanceFromBottom = thread.scrollHeight - thread.scrollTop - thread.clientHeight;
  return distanceFromBottom <= HERMES_AUTO_SCROLL_THRESHOLD_PX;
}

function readPersistedHermesState(): PersistedHermesState {
  if (typeof window === "undefined") {
    return { draft: "" };
  }

  try {
    const raw = window.localStorage.getItem(HERMES_STORAGE_KEY);
    if (!raw) {
      return { draft: "" };
    }
    const parsed = JSON.parse(raw) as PersistedHermesState;
    return {
      draft: typeof parsed.draft === "string" ? parsed.draft : ""
    };
  } catch {
    return { draft: "" };
  }
}

function writePersistedHermesState(state: PersistedHermesState) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(HERMES_STORAGE_KEY, JSON.stringify(state));
}

function readFreshSessionState(): FreshSessionState {
  if (typeof window === "undefined") {
    return { startedAt: null, sessionId: null, sessionKey: null };
  }

  try {
    const raw = window.localStorage.getItem(HERMES_FRESH_SESSION_STORAGE_KEY);

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

  window.localStorage.setItem(HERMES_FRESH_SESSION_STORAGE_KEY, JSON.stringify(state));
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

function formatMessageTimestamp(timestamp: string | null): string {
  if (!timestamp) {
    return "时间未知";
  }

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

function formatTimelineSeparator(timestamp: string | null): string {
  if (!timestamp) {
    return "时间未知";
  }

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

function shouldInsertTimeSeparator(previous: DisplayHermesMessage | null, current: DisplayHermesMessage) {
  if (!previous) {
    return true;
  }

  const previousTimestamp = Date.parse(previous.timestamp ?? "");
  const currentTimestamp = Date.parse(current.timestamp ?? "");

  if (!Number.isFinite(previousTimestamp) || !Number.isFinite(currentTimestamp)) {
    return false;
  }

  const previousDate = new Date(previousTimestamp);
  const currentDate = new Date(currentTimestamp);

  if (previousDate.toDateString() !== currentDate.toDateString()) {
    return true;
  }

  return currentTimestamp - previousTimestamp >= HERMES_TIME_SEPARATOR_BREAK_MS;
}

function shouldStartMessageGroup(previous: DisplayHermesMessage | null, current: DisplayHermesMessage) {
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

  const previousTimestamp = Date.parse(previous.timestamp ?? "");
  const currentTimestamp = Date.parse(current.timestamp ?? "");

  if (!Number.isFinite(previousTimestamp) || !Number.isFinite(currentTimestamp)) {
    return true;
  }

  return currentTimestamp - previousTimestamp >= HERMES_GROUP_BREAK_MS;
}

function filterMessagesForFreshSession<T extends { timestamp: string | null }>(messages: T[], startedAt: string | null) {
  if (!startedAt) {
    return messages;
  }

  const startedAtMs = Date.parse(startedAt);

  if (!Number.isFinite(startedAtMs)) {
    return messages;
  }

  return messages.filter((message) => {
    if (!message.timestamp) {
      return false;
    }

    const timestampMs = Date.parse(message.timestamp);
    return Number.isFinite(timestampMs) ? timestampMs >= startedAtMs : false;
  });
}

function mergeMessages(remoteMessages: StudioHermesMessage[], localMessages: LocalHermesMessage[]): DisplayHermesMessage[] {
  return [
    ...remoteMessages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      source: "remote" as const
    })),
    ...localMessages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      source: "local" as const,
      deliveryStatus: message.deliveryStatus
    }))
  ].sort((left, right) => {
    const leftTimestamp = Date.parse(left.timestamp ?? "");
    const rightTimestamp = Date.parse(right.timestamp ?? "");

    if (Number.isFinite(leftTimestamp) && Number.isFinite(rightTimestamp) && leftTimestamp !== rightTimestamp) {
      return leftTimestamp - rightTimestamp;
    }

    if (left.source !== right.source) {
      return left.source === "remote" ? -1 : 1;
    }

    return left.id.localeCompare(right.id);
  });
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

function buildHermesNextStep(scope: "gateway" | "model" | "send" | "connection", detail: string): string {
  if (/command not found|not recognized|找不到|未检测到 hermes/i.test(detail)) {
    return "在 WSL 里确认 hermes CLI 已安装并加入 PATH，然后刷新 Hermes 状态。";
  }

  if (/timeout|timed out|超时/i.test(detail)) {
    return "先手动执行 Hermes 状态命令，确认是否被网络、认证或后台进程阻塞。";
  }

  if (/permission|denied|权限/i.test(detail)) {
    return "检查 WSL 用户权限、Hermes 配置文件权限和网关端口占用。";
  }

  if (scope === "gateway") {
    return "刷新网关状态；如果仍不可用，手动运行 hermes gateway status --all --deep。";
  }

  if (scope === "model") {
    return "确认模型别名在 Hermes 配置中存在，再创建新会话验证。";
  }

  if (scope === "connection") {
    return "先刷新 Hermes 连接状态，再确认 gateway 与认证状态均可用。";
  }

  return "确认 Hermes 已连接且当前会话存在，然后点击重试发送。";
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

function MessageBubble({
  message,
  grouped,
  onRetry
}: {
  message: DisplayHermesMessage;
  grouped: boolean;
  onRetry?: (messageId: string) => void;
}) {
  const assistantLike = message.role !== "user";
  const roleLabel =
    message.role === "assistant"
      ? "Hermes"
      : message.role === "tool"
        ? "工具"
        : message.role === "system"
          ? "系统"
          : "你";

  return (
    <article
      className={
        assistantLike
          ? `chat-message chat-message--assistant ${grouped ? "chat-message--grouped" : ""}`
          : `chat-message chat-message--user ${grouped ? "chat-message--grouped" : ""}`
      }
    >
      {!grouped ? (
        <div className="chat-message__header">
          <span className="chat-message__role">{roleLabel}</span>
          <em>{formatMessageTimestamp(message.timestamp)}</em>
        </div>
      ) : null}

      <div className="chat-message__body">{message.content}</div>

      {message.source === "local" && message.deliveryStatus ? (
        <div className="chat-message__meta">
          <span className={`chat-message__delivery chat-message__delivery--${message.deliveryStatus}`}>
            {message.deliveryStatus === "pending" ? "发送中…" : "发送失败"}
          </span>
          {message.deliveryStatus === "failed" && onRetry ? (
            <button type="button" className="secondary-button chat-message__retry" onClick={() => onRetry(message.id)}>
              重试发送
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function HermesPage({
  bridgeStatus,
  runtimeStatus,
  workspaceLabel,
  readinessLabel,
  gatewayStatus,
  networkStatus
}: HermesPageProps) {
  const persistedFreshSession = readFreshSessionState();
  const [draft, setDraft] = useState(() => readPersistedHermesState().draft);
  const [currentSession, setCurrentSession] = useState<StudioHermesSessionSummary | null>(null);
  const [messages, setMessages] = useState<StudioHermesMessage[]>([]);
  const [localMessages, setLocalMessages] = useState<LocalHermesMessage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelCatalog, setModelCatalog] = useState<StudioModelCatalog | null>(null);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [applyingModel, setApplyingModel] = useState(false);
  const [gatewayServiceState, setGatewayServiceState] = useState<StudioGatewayServiceState | null>(null);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [gatewayBusy, setGatewayBusy] = useState(false);
  const [hermesState, setHermesState] = useState<StudioHermesState | null>(null);
  const [hermesControlError, setHermesControlError] = useState<string | null>(null);
  const [hermesBusy, setHermesBusy] = useState(false);
  const [sendResult, setSendResult] = useState<OperationResultState | null>(null);
  const [modelResult, setModelResult] = useState<OperationResultState | null>(null);
  const [gatewayResult, setGatewayResult] = useState<OperationResultState | null>(null);
  const [connectionResult, setConnectionResult] = useState<OperationResultState | null>(null);
  const [freshSessionStartedAt, setFreshSessionStartedAt] = useState(() => persistedFreshSession.startedAt);
  const [freshSessionId, setFreshSessionId] = useState(() => persistedFreshSession.sessionId);
  const [freshSessionKey, setFreshSessionKey] = useState(() => persistedFreshSession.sessionKey);
  const [previousSessionId, setPreviousSessionId] = useState<string | null>(null);
  const [detachedFromLatest, setDetachedFromLatest] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const freshSessionActive = Boolean(freshSessionId);
  const displayMessages = mergeMessages(messages, localMessages);
  const latestMessage = displayMessages.length > 0 ? displayMessages[displayMessages.length - 1] : null;
  const unreadCount = detachedFromLatest ? Math.max(0, displayMessages.length - lastSeenCount) : 0;
  const firstUnreadIndex = unreadCount > 0 ? displayMessages.length - unreadCount : -1;
  const hermesCanSend = Boolean(currentSession) && (hermesState?.availability ?? "blocked") !== "blocked";
  const canSend = draft.trim().length > 0 && !submitting && hermesCanSend;
  const canApplyModel = selectedModelId.trim().length > 0 && !applyingModel && selectedModelId !== (modelCatalog?.selectedModelId ?? "");

  useEffect(() => {
    writePersistedHermesState({ draft });
  }, [draft]);

  useEffect(() => {
    writeFreshSessionState({
      startedAt: freshSessionStartedAt,
      sessionId: freshSessionId,
      sessionKey: freshSessionKey
    });
  }, [freshSessionId, freshSessionKey, freshSessionStartedAt]);

  useEffect(() => {
    let cancelled = false;

    const refreshModelCatalog = async () => {
      try {
        console.log("[HermesPage] 开始加载模型列表...");
        const nextCatalog = await loadHermesModelCatalog();
        console.log("[HermesPage] 模型列表加载成功:", {
          selectedModelId: nextCatalog.selectedModelId,
          optionsCount: nextCatalog.options.length,
          options: nextCatalog.options.map(o => o.id)
        });

        if (cancelled) {
          return;
        }

        setModelCatalog(nextCatalog);
        setSelectedModelId(nextCatalog.selectedModelId ?? nextCatalog.options[0]?.id ?? "");
      } catch (cause) {
        console.error("[HermesPage] 模型列表加载失败:", cause);
        if (!cancelled) {
          const detail = extractErrorMessage(cause, "加载 Hermes 模型选项失败。");
          setModelError(detail);
          setModelResult(createOperationResult("error", "Hermes 模型列表加载未完成", buildHermesNextStep("model", detail), detail));
        }
      }
    };

    void refreshModelCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const refreshGatewayState = async () => {
      try {
        const nextState = await loadHermesGatewayServiceState();

        if (!cancelled) {
          setGatewayServiceState(nextState);
        }
      } catch (cause) {
        if (!cancelled) {
          const detail = extractErrorMessage(cause, "加载 Hermes Gateway 状态失败。");
          setGatewayError(detail);
          setGatewayResult(createOperationResult("error", "Hermes Gateway 状态读取未完成", buildHermesNextStep("gateway", detail), detail));
        }
      }
    };

    void refreshGatewayState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    const refreshHermesState = async () => {
      try {
        const nextState = await loadHermesState();

        if (!cancelled) {
          setHermesState(nextState);
        }
      } catch (cause) {
        if (!cancelled) {
          console.error("[HermesPage] 加载 Hermes 连接状态失败:", cause);
        }
      }
    };

    const attachEvents = async () => {
      try {
        const nextUnsubscribe = await subscribeToHermesEvents(() => {
          void refreshHermesState();
        });

        if (cancelled) {
          nextUnsubscribe();
          return;
        }

        unsubscribe = nextUnsubscribe;
      } catch (cause) {
        if (!cancelled) {
          console.warn("[HermesPage] Hermes 订阅事件失败:", cause);
        }
      }
    };

    void refreshHermesState();
    void attachEvents();

    const interval = window.setInterval(() => {
      void refreshHermesState();
    }, HERMES_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      unsubscribe?.();
    };
  }, []);

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

    updateStickiness();
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
        const sessionsResult = await getHermesSessions();

        if (cancelled) {
          return;
        }

        if (!sessionsResult.success) {
          setError(sessionsResult.error ?? "加载 Hermes 会话失败。");
          setCurrentSession(null);
          setMessages([]);
          setLocalMessages([]);
          setDetachedFromLatest(false);
          setLastSeenCount(0);
          return;
        }

        if (sessionsResult.sessions.length === 0) {
          setCurrentSession(null);
          setMessages([]);
          setLocalMessages([]);
          setDetachedFromLatest(false);
          setLastSeenCount(0);
          setError(null);
          return;
        }

        const latestSession =
          (freshSessionId ? sessionsResult.sessions.find((session) => session.id === freshSessionId) : null) ??
          sessionsResult.sessions[0];

        if (!latestSession) {
          setError("当前 Hermes 会话列表异常。");
          setCurrentSession(null);
          setMessages([]);
          setLocalMessages([]);
          setDetachedFromLatest(false);
          setLastSeenCount(0);
          return;
        }

        setCurrentSession(latestSession);

        const messagesResult = await getHermesMessages(latestSession.id);

        if (cancelled) {
          return;
        }

        if (messagesResult.success) {
          setError(null);
          setMessages(filterMessagesForFreshSession(messagesResult.messages, freshSessionId ? freshSessionStartedAt : null));
          setLastUpdatedAt(Date.now());

          if (shouldStickToLatest) {
            window.requestAnimationFrame(() => {
              const nextThread = getThreadElement();

              if (nextThread && shouldStickToLatest) {
                nextThread.scrollTop = nextThread.scrollHeight;
                nextThread.dataset.stickToLatest = "true";
                setDetachedFromLatest(false);
              }
            });
          }
        } else {
          setError(messagesResult.error ?? "加载 Hermes 会话消息失败。");
          setMessages([]);
          setLocalMessages([]);
          setDetachedFromLatest(false);
          setLastSeenCount(0);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "加载 Hermes 会话失败。");
          setCurrentSession(null);
          setMessages([]);
          setLocalMessages([]);
          setDetachedFromLatest(false);
          setLastSeenCount(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, HERMES_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [freshSessionId, submitting]);

  async function submitPrompt(prompt: string, retryMessageId?: string) {
    const normalizedPrompt = prompt.trim();

    if (!normalizedPrompt || submitting) {
      return;
    }

    if (!currentSession || !hermesCanSend) {
      const detail = hermesState?.disabledReason ?? "当前发送链路不可用，无法发送到 Hermes。";
      setError(detail);
      setSendResult(createOperationResult("error", "Hermes 发送受阻", buildHermesNextStep("send", detail), detail));
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
                content: normalizedPrompt,
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
          content: normalizedPrompt,
          timestamp: localMessageTimestamp,
          deliveryStatus: "pending"
        }
      ]);
      setDraft("");
    }

    setSubmitting(true);
    setError(null);
    setSendResult(createOperationResult("info", "正在发送到 Hermes", "等待 Hermes 返回，完成后会同步当前会话消息。", normalizedPrompt));

    try {
      const result = await sendHermesMessage(currentSession.id, normalizedPrompt);

      if (result.sent) {
        setLocalMessages((currentMessages) => currentMessages.filter((message) => message.id !== localMessageId));

        const messagesResult = await getHermesMessages(currentSession.id);
        if (messagesResult.success) {
          setMessages(messagesResult.messages);
          setSendResult(
            createOperationResult(
              "success",
              "Hermes 发送完成",
              "查看最新回复；如果要验证模型切换，请创建新会话后发送短消息。",
              `${messagesResult.messages.length} 条消息已同步。`
            )
          );
        }
      } else {
        throw new Error(result.error || "发送失败");
      }
    } catch (cause) {
      const detail = extractErrorMessage(cause, "发送 Hermes 消息失败。");
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
      setSendResult(createOperationResult("error", "Hermes 发送未完成", buildHermesNextStep("send", detail), detail));
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

    await submitPrompt(failedMessage.content, messageId);
  }

  async function handleStartFreshSession() {
    const startedAt = new Date().toISOString();
    const shouldTrackPrevious = !freshSessionActive;
    const previousSession = shouldTrackPrevious ? currentSession?.id ?? null : previousSessionId;

    try {
      const createdSession = await createHermesSession(selectedModelId || null);

      setFreshSessionStartedAt(startedAt);
      setFreshSessionId(createdSession.id);
      setFreshSessionKey(createdSession.sessionKey ?? createdSession.id);
      setPreviousSessionId(shouldTrackPrevious ? previousSession : previousSessionId);
      setCurrentSession(createdSession);
      setMessages([]);
      setLocalMessages([]);
      setLastSeenCount(0);
      setDetachedFromLatest(false);
      setError(null);
      setDraft("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "创建 Hermes 新会话失败。");
      return;
    }

    const thread = getThreadElement();

    if (thread) {
      thread.dataset.stickToLatest = "true";
      thread.scrollTop = 0;
    }
  }

  async function handleReturnToCurrentSession() {
    const targetSessionId = previousSessionId;
    setFreshSessionStartedAt(null);
    setFreshSessionId(null);
    setFreshSessionKey(null);
    setPreviousSessionId(null);
    setLocalMessages([]);
    setLoading(true);
    let restoredCount = 0;
    const sessionsResult = await getHermesSessions();

    if (!sessionsResult.success || sessionsResult.sessions.length === 0) {
      setError(sessionsResult.error ?? "加载 Hermes 会话失败。");
      setCurrentSession(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    const targetSession =
      (targetSessionId ? sessionsResult.sessions.find((session) => session.id === targetSessionId) : null) ??
      sessionsResult.sessions[0];

    if (!targetSession) {
      setError("无法恢复当前会话。");
      setCurrentSession(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    setCurrentSession(targetSession);

    const messagesResult = await getHermesMessages(targetSession.id);

    if (messagesResult.success) {
      setMessages(messagesResult.messages);
      restoredCount = messagesResult.messages.length;
      setError(null);
    } else {
      setMessages([]);
      setError(messagesResult.error ?? "加载 Hermes 会话消息失败。");
    }

    setLoading(false);

    const thread = getThreadElement();

    if (thread) {
      thread.dataset.stickToLatest = "true";
      thread.scrollTop = thread.scrollHeight;
    }

    setDetachedFromLatest(false);
    setLastSeenCount(restoredCount);

    if (targetSessionId === null) {
      setError(null);
    }
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

  async function handleApplyModel() {
    if (!selectedModelId.trim() || applyingModel) {
      return;
    }

    setApplyingModel(true);
    setModelError(null);
    setModelResult(createOperationResult("info", "正在应用 Hermes 模型", "等待配置写入完成，后续新会话会优先使用该模型。", selectedModelId));

    try {
      const result = await setHermesModel(selectedModelId);

      setModelCatalog(result.catalog);
      setSelectedModelId(result.catalog.selectedModelId ?? result.catalog.options[0]?.id ?? selectedModelId);

      if (!result.applied) {
        const detail = result.error ?? "切换 Hermes 默认模型失败。";
        setModelError(detail);
        setModelResult(createOperationResult("error", "Hermes 模型应用未完成", buildHermesNextStep("model", detail), detail));
        return;
      }

      setModelResult(
        createOperationResult("success", "Hermes 模型已应用", "创建新会话或发送短消息，确认 Hermes 是否采用新模型。", result.catalog.selectedModelId ?? selectedModelId)
      );
    } catch (cause) {
      const detail = extractErrorMessage(cause, "切换 Hermes 默认模型失败。");
      setModelError(detail);
      setModelResult(createOperationResult("error", "Hermes 模型应用未完成", buildHermesNextStep("model", detail), detail));
    } finally {
      setApplyingModel(false);
    }
  }

  async function handleGatewayAction(action: "start" | "stop" | "refresh") {
    setGatewayBusy(action !== "refresh");
    setGatewayError(null);
    setHermesControlError(null);
    setGatewayResult(
      createOperationResult(
        "info",
        action === "refresh" ? "正在刷新 Hermes Gateway" : `正在${action === "start" ? "启动" : "停止"} Hermes Gateway`,
        "等待状态读取完成，最近结果会在这里更新。",
        gatewayServiceState?.detail ?? null
      )
    );

    try {
      if (action === "refresh") {
        const nextState = await loadHermesGatewayServiceState();
        setGatewayServiceState(nextState);
        setGatewayResult(
          createOperationResult(
            "success",
            "Hermes Gateway 状态已刷新",
            nextState.running ? "Gateway 正在运行；如仍不能发送，请检查 Hermes 连接状态。" : "如需发送 Hermes 消息，先启动网关。",
            nextState.detail
          )
        );
        return;
      }

      const result = action === "start" ? await startHermesGatewayService() : await stopHermesGatewayService();
      setGatewayServiceState(result.state);

      if (!result.applied) {
        const detail = result.error ?? `Hermes Gateway ${action === "start" ? "启动" : "停止"}失败。`;
        setGatewayError(detail);
        setGatewayResult(
          createOperationResult("error", `Hermes Gateway ${action === "start" ? "启动" : "停止"}未完成`, buildHermesNextStep("gateway", detail), detail)
        );
        return;
      }

      setGatewayResult(
        createOperationResult(
          "success",
          `Hermes Gateway 已${action === "start" ? "启动" : "停止"}`,
          result.state.running ? "现在可以连接 Hermes 或刷新会话。" : "需要继续会话时先重新启动 Gateway。",
          result.state.detail
        )
      );
    } catch (cause) {
      const detail = extractErrorMessage(cause, `Hermes Gateway ${action === "start" ? "启动" : "停止"}失败。`);
      setGatewayError(detail);
      setGatewayResult(
        createOperationResult("error", `Hermes Gateway ${action === "start" ? "启动" : "停止"}未完成`, buildHermesNextStep("gateway", detail), detail)
      );
    } finally {
      setGatewayBusy(false);
    }
  }

  async function handleConnectHermes() {
    if (!hermesState?.canConnect || hermesBusy) {
      return;
    }

    setHermesBusy(true);
    setHermesControlError(null);
    setConnectionResult(createOperationResult("info", "正在连接 Hermes", "等待连接状态返回，完成后会更新发送可用性。", hermesState.sessionLabel));

    try {
      const result = await connectHermes();
      setHermesState(result.state);

      if (!result.started) {
        const detail = result.state.disabledReason ?? "Hermes 连接失败。";
        setHermesControlError(detail);
        setConnectionResult(createOperationResult("error", "Hermes 连接未完成", buildHermesNextStep("connection", detail), detail));
        return;
      }
      setConnectionResult(createOperationResult("success", "Hermes 已连接", "现在可以选择会话并发送消息。", result.state.sessionLabel));
    } catch (cause) {
      const detail = extractErrorMessage(cause, "连接 Hermes 失败。");
      setHermesControlError(detail);
      setConnectionResult(createOperationResult("error", "Hermes 连接未完成", buildHermesNextStep("connection", detail), detail));
      try {
        setHermesState(await loadHermesState());
      } catch {
        // ignore
      }
    } finally {
      setHermesBusy(false);
    }
  }

  async function handleDisconnectHermes() {
    if (!hermesState?.canDisconnect || hermesBusy) {
      return;
    }

    setHermesBusy(true);
    setHermesControlError(null);
    setConnectionResult(createOperationResult("info", "正在断开 Hermes", "等待断开状态返回。", hermesState.sessionLabel));

    try {
      const result = await disconnectHermes();
      setHermesState(result.state);

      if (!result.stopped) {
        const detail = result.state.disabledReason ?? "断开 Hermes 失败。";
        setHermesControlError(detail);
        setConnectionResult(createOperationResult("error", "Hermes 断开未完成", buildHermesNextStep("connection", detail), detail));
        return;
      }
      setConnectionResult(createOperationResult("success", "Hermes 已断开", "需要继续会话时重新连接 Hermes。", result.state.sessionLabel));
    } catch (cause) {
      const detail = extractErrorMessage(cause, "断开 Hermes 失败。");
      setHermesControlError(detail);
      setConnectionResult(createOperationResult("error", "Hermes 断开未完成", buildHermesNextStep("connection", detail), detail));
      try {
        setHermesState(await loadHermesState());
      } catch {
        // ignore
      }
    } finally {
      setHermesBusy(false);
    }
  }

  const effectiveReadinessLabel = hermesState ? `Hermes ${hermesState.readinessLabel}` : readinessLabel;
  const isHermesBlocked = hermesState?.availability === "blocked";
  const isHermesConnected = hermesState?.availability === "connected";
  const liveStatusLabel = freshSessionActive ? "独立新会话" : isHermesConnected ? "已连接" : submitting ? "Hermes 回复中" : "等待 Hermes 可用";
  const latestMessageLabel = latestMessage
    ? `${latestMessage.role === "assistant" ? "Hermes" : latestMessage.role === "user" ? "你" : latestMessage.role === "tool" ? "工具" : "系统"} · ${formatMessageTimestamp(latestMessage.timestamp)}`
    : "暂无新消息";
  const composeHint = hermesCanSend
    ? "下面输入，按 Ctrl/Cmd + Enter 直接发送到 Hermes 会话。"
    : hermesState?.disabledReason ?? "当前发送链路不可用。";
  const composeStatus = submitting
    ? "Hermes 正在回复…"
    : !currentSession
      ? "检查 Hermes 会话"
      : hermesCanSend
        ? "可发送"
        : isHermesBlocked
          ? "Hermes 连接受阻"
          : "等待 Hermes 可用";
  const selectedModelLabel = resolveSelectedModelLabel(modelCatalog, selectedModelId);
  const visibleModelLabel = selectedModelLabel !== "未选择模型" ? selectedModelLabel : "等待识别模型";

  return (
    <section className="page chat-page chat-page--full">
      <article className="chat-workspace">
        <div className="chat-workspace__toolbar">
          <div className="chat-workspace__identity">
            <p className="eyebrow">Hermes 会话</p>
            <strong>{freshSessionActive ? freshSessionKey ?? currentSession?.label ?? "hermes:new" : currentSession?.label ?? "hermes:session:main"}</strong>
            <span>{currentSession ? `${currentSession.messageCount} 条消息 · ${visibleModelLabel}` : visibleModelLabel}</span>
          </div>
          <div className="chat-workspace__status">
            <span className="chat-workspace__status-chip">{selectedModelLabel}</span>
            <span className="chat-workspace__status-chip">{gatewayStatus}</span>
            <span className="chat-workspace__status-chip">{networkStatus}</span>
            <span className="chat-workspace__status-chip">{bridgeStatus}</span>
            <span className="chat-workspace__status-chip">{runtimeStatus}</span>
            <span className="chat-workspace__status-chip">{workspaceLabel}</span>
            <span className="chat-workspace__status-chip">{effectiveReadinessLabel}</span>
            <span className="chat-workspace__status-chip">{formatUpdatedAt(lastUpdatedAt)}</span>
          </div>
        </div>

        <div className="chat-workspace__controls">
          <label className="chat-select-field">
            <span>模型选项</span>
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
          <div className="chat-session-actions">
            <div className="chat-session-actions__summary">
              <strong>{selectedModelLabel}</strong>
              <span>修改的是 Hermes 的默认模型配置，后续消息会优先沿用这个选择。</span>
            </div>
            <div className="chat-session-actions__buttons">
              {freshSessionActive ? (
                <button type="button" className="secondary-button" onClick={() => void handleReturnToCurrentSession()}>
                  返回当前会话
                </button>
              ) : null}
              <button type="button" className="secondary-button" onClick={() => void handleStartFreshSession()}>
                新建会话
              </button>
              <button type="button" className="secondary-button" onClick={() => void handleApplyModel()} disabled={!canApplyModel}>
                {applyingModel ? "应用中…" : "应用模型"}
              </button>
            </div>
            <OperationResultPanel label="应用结果" result={modelResult} emptySummary="尚未执行模型应用" emptyNextStep="选择模型后点击应用模型。" />
          </div>
          <div className="chat-session-actions">
            <div className="chat-session-actions__summary">
              <strong>{gatewayServiceState?.statusLabel ?? "Gateway 状态加载中"}</strong>
              <span>{gatewayServiceState?.detail ?? "读取 Hermes Gateway 的独立服务状态。"}</span>
            </div>
            <div className="chat-session-actions__buttons">
              <button type="button" className="secondary-button" onClick={() => void handleGatewayAction("refresh")} disabled={gatewayBusy}>
                刷新网关
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => void handleGatewayAction("start")}
                disabled={gatewayBusy || gatewayServiceState?.startAllowed === false}
              >
                启动网关
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => void handleGatewayAction("stop")}
                disabled={gatewayBusy || gatewayServiceState?.stopAllowed === false}
              >
                停止网关
              </button>
            </div>
            <OperationResultPanel label="最近结果" result={gatewayResult} emptySummary="尚未执行网关操作" emptyNextStep="先刷新网关状态，确认 Gateway 是否可达。" />
          </div>
          <div className="chat-session-actions">
            <div className="chat-session-actions__summary">
              <strong>{hermesState ? hermesState.sessionLabel : "未检测到 Hermes 状态"}</strong>
              <span>{hermesState ? `${hermesState.transportLabel} · ${hermesState.authLabel}` : "读取 Hermes 连接状态中…"}</span>
            </div>
            <div className="chat-session-actions__buttons">
              <button type="button" className="secondary-button" onClick={() => void handleConnectHermes()} disabled={!hermesState?.canConnect || hermesBusy}>
                {hermesBusy ? "操作中…" : "连接 Hermes"}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => void handleDisconnectHermes()}
                disabled={!hermesState?.canDisconnect || hermesBusy}
              >
                {hermesBusy ? "操作中…" : "断开 Hermes"}
              </button>
            </div>
            <OperationResultPanel label="连接结果" result={connectionResult} emptySummary="尚未执行连接操作" emptyNextStep="先确认 Gateway 运行，再连接 Hermes。" />
          </div>
        </div>

        <div className="chat-live-strip">
          <div className="chat-live-strip__primary">
            <strong>实时动态</strong>
            <span>{liveStatusLabel}</span>
          </div>
          <div className="chat-live-strip__secondary">
            <span>{latestMessageLabel}</span>
            <span>常规同步 5s</span>
          </div>
        </div>

        <section className="chat-thread-shell">
          <div className="chat-thread-shell__header">
            <div className="chat-thread-shell__title">
              <strong>实时消息</strong>
              <span>你往上翻历史时不会再被拉回底部；只有贴近底部时才会继续跟随最新消息。</span>
            </div>
            <div className="chat-thread-shell__badges">
              <span className="chat-thread-shell__badge">{displayMessages.length} 条消息</span>
              <span className="chat-thread-shell__badge">{latestMessage?.role === "assistant" ? "最新回复" : "最新输入"}</span>
              <span className="chat-thread-shell__badge">{formatUpdatedAt(lastUpdatedAt)}</span>
            </div>
          </div>

          <div id={HERMES_THREAD_ID} className="chat-thread chat-thread--workspace">
            {loading ? (
              <div className="chat-empty-state chat-empty-state--workspace">
                <strong>正在读取 Hermes 会话记录</strong>
                <p>Studio 正在同步 Hermes 会话的最近聊天内容。</p>
              </div>
            ) : displayMessages.length === 0 ? (
              <div className="chat-empty-state chat-empty-state--workspace">
                <strong>{freshSessionActive ? "新会话已就绪" : "Hermes 会话里还没有可显示的消息"}</strong>
                <p>{freshSessionActive ? "现在只会显示你点击“新建会话”之后产生的新消息。" : "发送一条命令后，这里会直接出现 Hermes 会话的真实对话内容。"}</p>
              </div>
            ) : (
              displayMessages.map((message: DisplayHermesMessage, index: number) => {
                const previous: DisplayHermesMessage | null = index > 0 ? (displayMessages[index - 1] ?? null) : null;
                const showTimeSeparator = shouldInsertTimeSeparator(previous, message);
                const grouped = !shouldStartMessageGroup(previous, message);

                return (
                  <div key={message.id} className="chat-thread__item">
                    {showTimeSeparator ? (
                      <div className="chat-time-separator">
                        <span>{formatTimelineSeparator(message.timestamp)}</span>
                      </div>
                    ) : null}
                    {firstUnreadIndex === index ? (
                      <div className="chat-unread-marker">
                        <span>{unreadCount} 条新消息</span>
                      </div>
                    ) : null}
                    <MessageBubble message={message} grouped={grouped} onRetry={handleRetryMessage} />
                  </div>
                );
              })
            )}
          </div>

          {detachedFromLatest ? (
            <div className="chat-thread-shell__jump">
              <button type="button" className="quick-action-button quick-action-button--primary" onClick={handleJumpToLatest}>
                回到底部看最新回复
              </button>
            </div>
          ) : null}
        </section>

          <div className="chat-compose-panel">
            <div className="chat-compose-panel__header">
              <div>
                <strong>发送区</strong>
                <span>{composeHint}</span>
              </div>
              <em>{composeStatus}</em>
            </div>

          {freshSessionActive ? (
            <div className="chat-error">当前是独立新会话：后续消息会进入这个新的 Hermes session，不会继续写到上一个会话。</div>
          ) : null}

          {hermesControlError ? <div className="chat-error">{hermesControlError}</div> : null}
          {gatewayError ? <div className="chat-error">{gatewayError}</div> : null}
          {modelError ? <div className="chat-error">{modelError}</div> : null}
          {error ? <div className="chat-error">{error}</div> : null}
          <OperationResultPanel label="发送结果" result={sendResult} emptySummary="尚未发送消息" emptyNextStep="确认 Hermes 已连接且当前会话存在后再发送。" />

          <div className="chat-preset-strip chat-preset-strip--toolbar">
            {hermesPromptPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                className="secondary-button chat-preset-button"
                onClick={() => {
                  setDraft(preset);
                }}
              >
                {preset}
              </button>
            ))}
          </div>

          <label className="chat-composer-field">
            <span>命令内容</span>
            <textarea
              value={draft}
              onChange={(event: { target: { value: string } }) => {
                setDraft(event.target.value);
              }}
              onKeyDown={(event: { key: string; metaKey: boolean; ctrlKey: boolean; preventDefault: () => void }) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder="输入你想发送给 Hermes 的命令或问题"
              disabled={!hermesCanSend || submitting}
              rows={2}
            />
          </label>

          <div className="chat-compose-panel__actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                void handleSubmit();
              }}
              disabled={!canSend}
            >
              {submitting ? "发送中…" : "发送到 Hermes"}
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
