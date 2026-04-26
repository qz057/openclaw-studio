import { useEffect, useState } from "react";
import { loadClaudeSessionMessages, loadClaudeSnapshot } from "@openclaw/bridge";
import type { StudioClaudeMessage, StudioClaudeSessionSummary, StudioClaudeSnapshot } from "@openclaw/shared";

const REFRESH_INTERVAL_MS = 5_000;

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatIsoTimestamp(timestamp: string | null): string {
  if (!timestamp) {
    return "时间未知";
  }

  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) ? formatTimestamp(parsed) : timestamp;
}

function formatProjectLabel(session: StudioClaudeSessionSummary): string {
  return session.projectPath ?? session.projectKey;
}

function getRoleLabel(message: StudioClaudeMessage): string {
  switch (message.role) {
    case "assistant":
      return "Claude";
    case "tool":
      return "工具";
    case "system":
      return "系统";
    default:
      return "你";
  }
}

function MessageBubble({ message }: { message: StudioClaudeMessage }) {
  const assistantLike = message.role !== "user";
  const kindLabel =
    message.kind === "tool_use"
      ? "工具调用"
      : message.kind === "tool_result"
        ? "工具结果"
        : message.kind === "error"
          ? "错误"
          : null;

  return (
    <article className={assistantLike ? "chat-message chat-message--assistant" : "chat-message chat-message--user"}>
      <div className="chat-message__header">
        <span className="chat-message__role">{getRoleLabel(message)}</span>
        <em>{formatIsoTimestamp(message.timestamp)}</em>
      </div>
      <div className="chat-message__body">{message.text}</div>
      {kindLabel || message.model ? (
        <div className="chat-message__meta">
          {kindLabel ? <span className="chat-message__delivery">{kindLabel}</span> : null}
          {message.model ? <span className="chat-message__delivery">{message.model}</span> : null}
        </div>
      ) : null}
    </article>
  );
}

export function ClaudeSessionsPage() {
  const [snapshot, setSnapshot] = useState<StudioClaudeSnapshot | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<StudioClaudeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const nextSnapshot = await loadClaudeSnapshot();

        if (cancelled) {
          return;
        }

        setSnapshot(nextSnapshot);
        setSelectedSessionId((current) => {
          if (current && nextSnapshot.sessions.some((session) => session.id === current)) {
            return current;
          }

          return nextSnapshot.sessions[0]?.id ?? null;
        });
        setLoading(false);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "加载 Claude 会话失败。");
          setLoading(false);
        }
      }
    };

    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const refreshMessages = async () => {
      if (!selectedSessionId) {
        setMessages([]);
        return;
      }

      try {
        setMessagesLoading(true);
        const nextMessages = await loadClaudeSessionMessages(selectedSessionId);

        if (!cancelled) {
          setMessages(nextMessages);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "加载 Claude 会话消息失败。");
        }
      } finally {
        if (!cancelled) {
          setMessagesLoading(false);
        }
      }
    };

    void refreshMessages();

    return () => {
      cancelled = true;
    };
  }, [selectedSessionId]);

  const sessions = snapshot?.sessions ?? [];
  const history = snapshot?.history ?? [];
  const settings = snapshot?.settings ?? null;
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null;
  const selectedHistory = selectedSession ? history.filter((entry) => entry.sessionId === selectedSession.id).slice(0, 8) : history.slice(0, 8);
  const activeSessionCount = sessions.filter((session) => session.active).length;

  return (
    <section className="page claude-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Claude Code</p>
          <h1>Claude 会话</h1>
        </div>
        <p className="page-summary">直接读取 `C:\\Users\\qz057\\.claude` 下的 settings、history 和 project session jsonl，显示真实 Claude Code 会话内容。</p>
      </div>

      <div className="metric-grid metric-grid--compact">
        <article className="surface card metric-card">
          <span className="metric-label">Sessions</span>
          <strong className="metric-value">{sessions.length}</strong>
          <p>当前扫描到的 Claude 会话文件。</p>
        </article>
        <article className="surface card metric-card">
          <span className="metric-label">Active</span>
          <strong className="metric-value">{activeSessionCount}</strong>
          <p>当前 `C:\\Users\\qz057\\.claude\\sessions` 里仍处于活动态的会话。</p>
        </article>
        <article className="surface card metric-card">
          <span className="metric-label">Model</span>
          <strong className="metric-value">{settings?.model ?? "Unknown"}</strong>
          <p>{settings?.modelType ?? "未识别模型类型"} · {settings?.availableModels.length ?? 0} 个候选</p>
        </article>
      </div>

      <div className="content-grid">
        <article className="surface card">
          <div className="card-header">
            <div>
              <h2>会话列表</h2>
              <p>{settings?.rootPath ?? "C:\\Users\\qz057\\.claude"} · 最近 {sessions.length} 个会话</p>
            </div>
            <span>{activeSessionCount} active</span>
          </div>
          <div className="stack-list claude-session-list">
            {loading ? (
              <article className="list-row list-row--stacked">
                <strong>正在读取 Claude 会话</strong>
                <p>扫描 `.claude/projects` 目录中。</p>
              </article>
            ) : sessions.length === 0 ? (
              <article className="list-row list-row--stacked">
                <strong>没有找到 Claude 会话</strong>
                <p>当前 `.claude/projects` 下还没有可读 session jsonl。</p>
              </article>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  className={session.id === selectedSessionId ? "claude-session-card claude-session-card--active" : "claude-session-card"}
                  onClick={() => {
                    setSelectedSessionId(session.id);
                  }}
                >
                  <strong>{formatProjectLabel(session)}</strong>
                  <p>{session.preview ?? "无预览内容"}</p>
                  <div className="row-meta row-meta--compact">
                    <span>{session.messageCount} 条消息</span>
                    <span>{formatTimestamp(session.updatedAt)}</span>
                    <span>{session.active ? `活动中${session.activePid ? ` · PID ${session.activePid}` : ""}` : "已结束"}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </article>

        <article className="surface card claude-thread-panel">
          <div className="card-header">
            <div>
              <h2>{selectedSession ? "会话内容" : "选择一个会话"}</h2>
              <p>
                {selectedSession
                  ? `${formatProjectLabel(selectedSession)} · ${selectedSession.id}`
                  : "从左侧点一个 Claude 会话，右侧显示真实聊天内容。"}
              </p>
            </div>
            {selectedSession ? <span>{messages.length} 条显示消息</span> : null}
          </div>

          <section className="chat-thread-shell">
            <div className="chat-thread-shell__header">
              <div className="chat-thread-shell__title">
                <strong>{selectedSession ? "Claude 真实会话流" : "暂无会话"}</strong>
                <span>{selectedSession ? "已从对应 project session jsonl 解析用户、Claude、工具和系统消息。" : "等待选择会话。"}</span>
              </div>
            </div>
            <div className="chat-thread chat-thread--workspace">
              {messagesLoading ? (
                <div className="chat-empty-state chat-empty-state--workspace">
                  <strong>正在读取会话消息</strong>
                  <p>加载 Claude session jsonl 中。</p>
                </div>
              ) : !selectedSession ? (
                <div className="chat-empty-state chat-empty-state--workspace">
                  <strong>还没有选中 Claude 会话</strong>
                  <p>左侧点击任意一个会话后，这里会直接显示聊天内容。</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-empty-state chat-empty-state--workspace">
                  <strong>这个会话暂时没有可显示消息</strong>
                  <p>可能只有快照元数据，或者当前会话文件里还没有可渲染文本。</p>
                </div>
              ) : (
                messages.map((message) => <MessageBubble key={message.id} message={message} />)
              )}
            </div>
          </section>
        </article>
      </div>

      <div className="content-grid">
        <article className="surface card">
          <div className="card-header">
            <div>
              <h2>最近历史</h2>
              <p>来自 `.claude/history.jsonl` 的最近输入记录。</p>
            </div>
            <span>{selectedHistory.length} visible</span>
          </div>
          <div className="stack-list">
            {selectedHistory.length > 0 ? (
              selectedHistory.map((entry) => (
                <article key={entry.id} className="list-row list-row--stacked">
                  <div className="row-heading">
                    <div>
                      <strong>{entry.display}</strong>
                      <p>{entry.projectPath ?? "未知项目"}</p>
                    </div>
                    <span>{formatTimestamp(entry.timestamp)}</span>
                  </div>
                </article>
              ))
            ) : (
              <article className="list-row list-row--stacked">
                <strong>暂无历史记录</strong>
                <p>当前没有可读的 Claude history.jsonl 记录。</p>
              </article>
            )}
          </div>
        </article>

        <article className="surface card">
          <div className="card-header">
            <div>
              <h2>Claude 配置</h2>
              <p>直接读取当前 `.claude/settings.json`。</p>
            </div>
          </div>
          <div className="stack-list">
            <article className="list-row list-row--stacked">
              <strong>根目录</strong>
              <p>{settings?.rootPath ?? "未知"}</p>
            </article>
            <article className="list-row list-row--stacked">
              <strong>当前模型</strong>
              <p>{settings?.model ?? "未知"} · {settings?.modelType ?? "未知类型"}</p>
            </article>
            <article className="list-row list-row--stacked">
              <strong>权限模式</strong>
              <p>{settings?.permissionMode ?? "未知"}</p>
            </article>
            <article className="list-row list-row--stacked">
              <strong>可选模型</strong>
              <p>{settings?.availableModels.join(" · ") || "无"}</p>
            </article>
          </div>
        </article>
      </div>

      {error ? <div className="chat-error">{error}</div> : null}
    </section>
  );
}
