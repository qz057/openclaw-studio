import { useEffect, useState } from "react";
import {
  createOpenClawChatSession,
  loadOpenClawChatState,
  loadOpenClawGatewayServiceState,
  loadOpenClawModelCatalog,
  sendOpenClawChatTurn,
  setOpenClawModel,
  startOpenClawGatewayService,
  stopOpenClawGatewayService
} from "@openclaw/bridge";
import type { StudioGatewayServiceState, StudioModelCatalog, StudioOpenClawChatMessage, StudioOpenClawChatState } from "@openclaw/shared";

interface ChatPageProps {
  bridgeStatus: string;
  runtimeStatus: string;
  workspaceLabel: string;
  readinessLabel: string;
  gatewayStatus: string;
  networkStatus: string;
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
  role: "user";
  text: string;
  timestamp: string;
  deliveryStatus: "pending" | "failed";
}

interface DisplayChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  source: "remote" | "local";
  deliveryStatus?: "pending" | "failed";
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

function resolveSelectedModelLabel(modelCatalog: StudioModelCatalog | null, selectedModelId: string): string {
  if (!selectedModelId) {
    return "未选择模型";
  }

  return modelCatalog?.options.find((option) => option.id === selectedModelId)?.label ?? selectedModelId;
}

function MessageBubble({
  message,
  grouped,
  onRetry
}: {
  message: DisplayChatMessage;
  grouped: boolean;
  onRetry?: (messageId: string) => void;
}) {
  return (
    <article
      className={
        message.role === "assistant"
          ? `chat-message chat-message--assistant ${grouped ? "chat-message--grouped" : ""}`
          : `chat-message chat-message--user ${grouped ? "chat-message--grouped" : ""}`
      }
    >
      {!grouped ? (
        <div className="chat-message__header">
          <span className="chat-message__role">{message.role === "assistant" ? "OpenClaw" : "你"}</span>
          <em>{formatMessageTimestamp(message.timestamp)}</em>
        </div>
      ) : null}

      <div className="chat-message__body">{message.text}</div>

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

export function ChatPage({
  bridgeStatus,
  runtimeStatus,
  workspaceLabel,
  readinessLabel,
  gatewayStatus,
  networkStatus
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
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [gatewayBusy, setGatewayBusy] = useState(false);
  const [freshSessionStartedAt, setFreshSessionStartedAt] = useState(() => persistedFreshSession.startedAt);
  const [freshSessionId, setFreshSessionId] = useState(() => persistedFreshSession.sessionId);
  const [freshSessionKey, setFreshSessionKey] = useState(() => persistedFreshSession.sessionKey);
  const [detachedFromLatest, setDetachedFromLatest] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);

  const freshSessionActive = Boolean(freshSessionId);
  const displayMessages = mergeMessages(messages, localMessages);
  const latestMessage = displayMessages.length > 0 ? displayMessages[displayMessages.length - 1] : null;
  const unreadCount = detachedFromLatest ? Math.max(0, displayMessages.length - lastSeenCount) : 0;
  const firstUnreadIndex = unreadCount > 0 ? displayMessages.length - unreadCount : -1;
  const canSend = draft.trim().length > 0 && !submitting && Boolean(chatState?.canSend);
  const canApplyModel = selectedModelId.trim().length > 0 && !applyingModel && selectedModelId !== (modelCatalog?.selectedModelId ?? "");
  const chatReadinessLabel = chatState ? `聊天状态 · ${chatState.readinessLabel}` : readinessLabel;
  const composeHint = chatState?.canSend
    ? "下面输入，按 Ctrl/Cmd + Enter 直接发送到主会话。"
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
        setSelectedModelId(nextCatalog.selectedModelId ?? nextCatalog.options[0]?.id ?? "");
      } catch (cause) {
        console.error("[ChatPage] 模型列表加载失败:", cause);
        if (!cancelled) {
          setModelError(cause instanceof Error ? cause.message : "加载模型选项失败。");
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
        const nextState = await loadOpenClawGatewayServiceState();

        if (!cancelled) {
          setGatewayServiceState(nextState);
        }
      } catch (cause) {
        if (!cancelled) {
          setGatewayError(cause instanceof Error ? cause.message : "加载 OpenClaw Gateway 状态失败。");
        }
      }
    };

    void refreshGatewayState();

    return () => {
      cancelled = true;
    };
  }, []);

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
        if (cancelled) {
          return;
        }

        const nextState = await loadOpenClawChatState(freshSessionId);

        if (cancelled) {
          return;
        }

        setChatState(nextState);
        setMessages(nextState.messages);
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
  }, [freshSessionId, submitting]);

  async function submitPrompt(prompt: string, retryMessageId?: string) {
    const normalizedPrompt = prompt.trim();

    if (!normalizedPrompt || submitting) {
      return;
    }

    if (!chatState?.canSend) {
      setError(chatState?.disabledReason ?? "当前发送链路不可用，无法发送到 OpenClaw。");
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

    try {
      await sendOpenClawChatTurn(normalizedPrompt, freshSessionId);
      setLocalMessages((currentMessages) => currentMessages.filter((message) => message.id !== localMessageId));
      const nextState = await loadOpenClawChatState(freshSessionId);
      setChatState(nextState);
      setMessages(nextState.messages);
    } catch (cause) {
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
      setError(cause instanceof Error ? cause.message : "发送聊天命令失败。");
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

    try {
      const result = await setOpenClawModel(selectedModelId);

      setModelCatalog(result.catalog);
      setSelectedModelId(result.catalog.selectedModelId ?? result.catalog.options[0]?.id ?? selectedModelId);

      if (!result.applied) {
        setModelError(result.error ?? "切换 OpenClaw 默认模型失败。");
        return;
      }

      const nextState = await loadOpenClawChatState(freshSessionId);
      setChatState(nextState);
    } catch (cause) {
      setModelError(cause instanceof Error ? cause.message : "切换 OpenClaw 默认模型失败。");
    } finally {
      setApplyingModel(false);
    }
  }

  async function handleGatewayAction(action: "start" | "stop" | "refresh") {
    setGatewayBusy(action !== "refresh");
    setGatewayError(null);

    try {
      if (action === "refresh") {
        setGatewayServiceState(await loadOpenClawGatewayServiceState());
        return;
      }

      const result = action === "start" ? await startOpenClawGatewayService() : await stopOpenClawGatewayService();
      setGatewayServiceState(result.state);

      if (!result.applied) {
        setGatewayError(result.error ?? `OpenClaw Gateway ${action === "start" ? "启动" : "停止"}失败。`);
      }
    } catch (cause) {
      setGatewayError(cause instanceof Error ? cause.message : `OpenClaw Gateway ${action === "start" ? "启动" : "停止"}失败。`);
    } finally {
      setGatewayBusy(false);
    }
  }

  const liveStatusLabel = freshSessionActive ? "独立新会话" : submitting ? "OpenClaw 回复中" : chatState?.readinessLabel ?? "检查发送链路";
  const latestMessageLabel = latestMessage ? `${latestMessage.role === "assistant" ? "OpenClaw" : "你"} · ${formatMessageTimestamp(latestMessage.timestamp)}` : "暂无新消息";
  const selectedModelLabel = resolveSelectedModelLabel(modelCatalog, selectedModelId);
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
      <article className="chat-workspace">
        <div className="chat-workspace__toolbar">
          <div className="chat-workspace__identity">
            <p className="eyebrow">OpenClaw 主会话</p>
            <strong>{freshSessionActive ? freshSessionKey ?? "新会话" : chatState?.sessionKey ?? "agent:main:main"}</strong>
            <span>{visibleModelLabel}</span>
          </div>
          <div className="chat-workspace__status">
            <span className="chat-workspace__status-chip">{selectedModelLabel}</span>
            <span className="chat-workspace__status-chip">{gatewayStatus}</span>
            <span className="chat-workspace__status-chip">{networkStatus}</span>
            <span className="chat-workspace__status-chip">{bridgeStatus}</span>
            <span className="chat-workspace__status-chip">{runtimeStatus}</span>
            <span className="chat-workspace__status-chip">{workspaceLabel}</span>
            <span className="chat-workspace__status-chip">{chatReadinessLabel}</span>
            <span className="chat-workspace__status-chip">{formatUpdatedAt(chatState?.updatedAt ?? null)}</span>
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
              <span>修改的是 OpenClaw 主会话的默认模型，新回合会沿用这个选择。</span>
            </div>
            <div className="chat-session-actions__buttons">
              {freshSessionActive ? (
                <button type="button" className="secondary-button" onClick={() => void handleReturnToMainSession()}>
                  返回主会话
                </button>
              ) : null}
              <button type="button" className="secondary-button" onClick={() => void handleStartFreshSession()}>
                新建会话
              </button>
              <button type="button" className="secondary-button" onClick={() => void handleApplyModel()} disabled={!canApplyModel}>
                {applyingModel ? "应用中…" : "应用模型"}
              </button>
            </div>
          </div>
          <div className="chat-session-actions">
            <div className="chat-session-actions__summary">
              <strong>{gatewayServiceState?.statusLabel ?? "Gateway 状态加载中"}</strong>
              <span>{gatewayServiceState?.detail ?? "读取 OpenClaw Gateway 的独立服务状态。"}</span>
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
          </div>
        </div>

        <div className="chat-live-strip">
          <div className="chat-live-strip__primary">
            <strong>实时动态</strong>
            <span>{liveStatusLabel}</span>
          </div>
          <div className="chat-live-strip__secondary">
            <span>{latestMessageLabel}</span>
            <span>{submitting ? "加速同步 1.2s" : "常规同步 4s"}</span>
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
              <span className="chat-thread-shell__badge">{formatUpdatedAt(chatState?.updatedAt ?? null)}</span>
            </div>
          </div>

          <div id={CHAT_THREAD_ID} className="chat-thread chat-thread--workspace">
            {loading ? (
              <div className="chat-empty-state chat-empty-state--workspace">
                <strong>正在读取主会话记录</strong>
                <p>Studio 正在同步 OpenClaw 主会话的最近聊天内容。</p>
              </div>
            ) : displayMessages.length === 0 ? (
              <div className="chat-empty-state chat-empty-state--workspace">
                <strong>{freshSessionActive ? "新会话已就绪" : "主会话里还没有可显示的文本消息"}</strong>
                <p>{freshSessionActive ? "现在只会显示你点击“新建会话”之后产生的新消息。" : "发送一条命令后，这里会直接出现 OpenClaw 主会话的真实对话内容。"}</p>
              </div>
            ) : (
              displayMessages.map((message: DisplayChatMessage, index: number) => {
                const previous: DisplayChatMessage | null = index > 0 ? (displayMessages[index - 1] ?? null) : null;
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
            <div className="chat-error">当前是独立新会话：后续消息不会写回主会话，只显示这个新会话里的内容。</div>
          ) : null}

          {gatewayError ? <div className="chat-error">{gatewayError}</div> : null}
          {modelError ? <div className="chat-error">{modelError}</div> : null}
          {chatState?.disabledReason ? <div className="chat-error">{chatState.disabledReason}</div> : null}
          {error ? <div className="chat-error">{error}</div> : null}

          <div className="chat-preset-strip chat-preset-strip--toolbar">
            {promptPresets.map((preset) => (
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
              onKeyDown={(event: { metaKey: boolean; ctrlKey: boolean; key: string; preventDefault: () => void }) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder="直接向 OpenClaw 主会话发消息，例如：总结当前 OpenClaw 状态，并告诉我下一步最应该做什么。"
              rows={2}
              disabled={!chatState?.canSend}
            />
          </label>

          <div className="chat-composer-actions">
            <button type="button" className="secondary-button" onClick={() => setDraft("")} disabled={submitting || draft.length === 0}>
              清空
            </button>
            <div className="chat-composer-actions__primary">
              <button type="button" className="quick-action-button quick-action-button--primary" onClick={() => void handleSubmit()} disabled={!canSend}>
                <strong>{submitting ? "发送中…" : chatState?.canSend ? "发送到 OpenClaw" : "当前不可发送"}</strong>
                <span>{chatState?.canSend ? "Ctrl/Cmd + Enter" : "检查发送链路"}</span>
              </button>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
