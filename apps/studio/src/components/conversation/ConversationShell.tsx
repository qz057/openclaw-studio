import type { ReactNode } from "react";
import {
  Activity,
  Archive,
  Bot,
  ChevronRight,
  Gauge,
  History,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Power,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  TerminalSquare,
  Wrench
} from "lucide-react";

export type ConversationSurfaceId = "openclaw" | "hermes";
export type ConversationNavTarget = "dashboard" | "chat" | "sessions" | "agents" | "skills" | "settings";
export type ConversationTone = "neutral" | "active" | "positive" | "warning" | "danger" | "violet";

export interface ConversationChip {
  label: string;
  tone?: ConversationTone;
}

interface ConversationGatewaySummary {
  openclaw: string;
  hermes: string;
  sampling: string;
  host: string;
  admin: string;
}

interface ConversationShellProps {
  activeSurface: ConversationSurfaceId;
  selectedSessionId: string;
  header: SessionHeaderProps;
  gatewaySummary: ConversationGatewaySummary;
  children: ReactNode;
  inspector: ReactNode;
  onCreateSession?: () => void;
  onNavigatePage?: (pageId: ConversationNavTarget) => void;
  onSessionSurfaceChange?: (surface: ConversationSurfaceId) => void;
}

export interface SessionHeaderProps {
  title: string;
  subtitle: string;
  chips: ConversationChip[];
  onCreateSession?: () => void;
  onRefresh?: () => void;
  onSplit?: () => void;
  onCopy?: () => void;
  onShare?: () => void;
  onMore?: () => void;
}

export interface ChatPanelProps {
  title: string;
  subtitle: string;
  statusChips: ConversationChip[];
  contextChips: ConversationChip[];
  children: ReactNode;
  composer: ReactNode;
  chart?: ReactNode;
}

export interface MessageTimelineProps {
  threadId: string;
  loading: boolean;
  emptyTitle: string;
  emptyDescription: string;
  waitingNotice?: string;
  children: ReactNode;
  detachedFromLatest?: boolean;
  onJumpToLatest?: () => void;
}

export interface MessageBubbleProps {
  role: "assistant" | "user" | "system" | "tool";
  roleLabel: string;
  timeLabel: string;
  text: string;
  grouped: boolean;
  deliveryStatus?: "pending" | "failed";
  onRetry?: () => void;
}

export interface ComposerBarProps {
  value: string;
  placeholder: string;
  disabled: boolean;
  canSend: boolean;
  submitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  statusLabel: string;
  helperText: string;
  presets: string[];
  errors?: Array<string | null | undefined>;
  result?: ReactNode;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  onPresetSelect: (preset: string) => void;
  onKeyDown?: (event: {
    key: string;
    shiftKey: boolean;
    metaKey: boolean;
    ctrlKey: boolean;
    preventDefault: () => void;
  }) => void;
}

export interface ModelRouteCardProps {
  title: string;
  currentModel: string;
  secondaryModel: string;
  routeStrategy: string;
  result?: ReactNode;
  children?: ReactNode;
}

export interface ContextTokenCardProps {
  contextLabel: string;
  progress: number;
  rows: Array<{ label: string; value: string }>;
}

export interface GatewayControlCardProps {
  openclawStatus: string;
  hermesStatus: string;
  openclawLatency: string;
  hermesLatency: string;
  result?: ReactNode;
  children?: ReactNode;
}

export interface SessionActionsCardProps {
  status: string;
  canSendLabel: string;
  result?: ReactNode;
  children?: ReactNode;
}

const navGroups: Array<{
  label: string;
  items: Array<{
    id: string;
    title: string;
    subtitle: string;
    icon: ReactNode;
    target?: ConversationNavTarget;
    surface?: ConversationSurfaceId;
  }>;
}> = [
  {
    label: "主导航",
    items: [
      {
        id: "dashboard",
        title: "总览",
        subtitle: "运行健康",
        target: "dashboard",
        icon: <LayoutDashboard size={18} strokeWidth={2.1} aria-hidden="true" />
      },
      {
        id: "current",
        title: "主会话",
        subtitle: "当前活动",
        target: "chat",
        surface: "openclaw",
        icon: <MessageSquare size={18} strokeWidth={2.1} aria-hidden="true" />
      },
      {
        id: "hermes",
        title: "Hermes",
        subtitle: "记忆会话",
        target: "chat",
        surface: "hermes",
        icon: <TerminalSquare size={18} strokeWidth={2.1} aria-hidden="true" />
      },
      {
        id: "history",
        title: "历史",
        subtitle: "历史与恢复",
        target: "sessions",
        icon: <History size={18} strokeWidth={2.1} aria-hidden="true" />
      }
    ]
  },
  {
    label: "系统",
    items: [
      {
        id: "settings",
        title: "配置",
        subtitle: "当前配置",
        target: "settings",
        icon: <Settings size={18} strokeWidth={2.1} aria-hidden="true" />
      },
      {
        id: "diagnostics",
        title: "高级诊断",
        subtitle: "诊断与审查",
        target: "agents",
        icon: <Wrench size={18} strokeWidth={2.1} aria-hidden="true" />
      }
    ]
  }
];

const sessionGroups: Array<{
  label: string;
  items: Array<{
    id: string;
    title: string;
    meta: string;
    time: string;
    surface?: ConversationSurfaceId;
  }>;
}> = [
  {
    label: "进行中",
    items: [
      { id: "openclaw-main", title: "主会话", meta: "gpt-5.5 · relay", time: "15:20", surface: "openclaw" },
      { id: "hermes-memory", title: "Hermes 记忆会话", meta: "Hermes · 会话层", time: "刚刚", surface: "hermes" },
      { id: "api-debug", title: "API 调试", meta: "gateway · relay", time: "10:42" }
    ]
  },
  {
    label: "最近",
    items: [
      { id: "incident-debug", title: "故障排查", meta: "runtime · alerts", time: "昨天" },
      { id: "frontend-talk", title: "前端实现讨论", meta: "ui · layout", time: "昨天" }
    ]
  }
];

export function ConversationShell({
  activeSurface,
  selectedSessionId,
  header,
  gatewaySummary,
  children,
  inspector,
  onCreateSession,
  onNavigatePage,
  onSessionSurfaceChange
}: ConversationShellProps) {
  return (
    <section className="conversation-shell" aria-label="Conversation Shell">
      <GlobalNav
        activeSurface={activeSurface}
        gatewaySummary={gatewaySummary}
        onNavigatePage={onNavigatePage}
        onSessionSurfaceChange={onSessionSurfaceChange}
      />
      <SessionListPanel
        selectedSessionId={selectedSessionId}
        onCreateSession={onCreateSession}
        onNavigatePage={onNavigatePage}
        onSessionSurfaceChange={onSessionSurfaceChange}
      />
      <SessionHeader {...header} />
      <main className="conversation-shell__main">{children}</main>
      <InspectorPanel>{inspector}</InspectorPanel>
    </section>
  );
}

export function GlobalNav({
  activeSurface,
  gatewaySummary,
  onNavigatePage,
  onSessionSurfaceChange
}: {
  activeSurface: ConversationSurfaceId;
  gatewaySummary: ConversationGatewaySummary;
  onNavigatePage?: (pageId: ConversationNavTarget) => void;
  onSessionSurfaceChange?: (surface: ConversationSurfaceId) => void;
}) {
  return (
    <aside className="conversation-global-nav" aria-label="全局导航栏">
      <div className="conversation-brand">
        <span className="conversation-brand__mark" aria-hidden="true">
          <ShieldCheck size={22} strokeWidth={2.3} />
        </span>
        <div>
          <strong>山谷智合</strong>
          <span>OpenClaw Console</span>
        </div>
      </div>

      <div className="conversation-global-nav__groups">
        {navGroups.map((group) => (
          <nav key={group.label} className="conversation-nav-group" aria-label={group.label}>
            <span className="conversation-nav-group__label">{group.label}</span>
            {group.items.map((item) => {
              const active = item.surface ? item.surface === activeSurface : false;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={active ? "conversation-nav-item conversation-nav-item--active" : "conversation-nav-item"}
                  onClick={() => {
                    if (item.surface) {
                      onSessionSurfaceChange?.(item.surface);
                    }
                    if (item.target) {
                      onNavigatePage?.(item.target);
                    }
                  }}
                >
                  <span className="conversation-nav-item__icon">{item.icon}</span>
                  <span className="conversation-nav-item__copy">
                    <strong>{item.title}</strong>
                    <em>{item.subtitle}</em>
                  </span>
                </button>
              );
            })}
          </nav>
        ))}
      </div>

      <div className="conversation-nav-status" aria-label="网关连接状态">
        <div className="conversation-nav-status__header">
          <Power size={15} strokeWidth={2.2} aria-hidden="true" />
          <strong>网关连接</strong>
        </div>
        <StatusLine label="OpenClaw Gateway" value={gatewaySummary.openclaw} tone="positive" />
        <StatusLine label="Hermes Gateway" value={gatewaySummary.hermes} tone={gatewaySummary.hermes.includes("待") ? "warning" : "positive"} />
        <div className="conversation-nav-status__grid">
          <span>采样</span>
          <strong>{gatewaySummary.sampling}</strong>
        </div>
      </div>
    </aside>
  );
}

export function SessionListPanel({
  selectedSessionId,
  onCreateSession,
  onNavigatePage,
  onSessionSurfaceChange
}: {
  selectedSessionId: string;
  onCreateSession?: () => void;
  onNavigatePage?: (pageId: ConversationNavTarget) => void;
  onSessionSurfaceChange?: (surface: ConversationSurfaceId) => void;
}) {
  return (
    <aside className="conversation-session-list" aria-label="会话列表栏">
      <div className="conversation-session-list__top">
        <div>
          <strong>会话列表</strong>
          <span>关键会话与恢复入口</span>
        </div>
        <button type="button" className="conversation-mini-button conversation-mini-button--primary" onClick={onCreateSession}>
          <Plus size={15} strokeWidth={2.4} aria-hidden="true" />
          新建
        </button>
      </div>
      <label className="conversation-search">
        <Search size={15} strokeWidth={2.2} aria-hidden="true" />
        <input placeholder="搜索会话..." />
      </label>
      <div className="conversation-filter-tabs" role="tablist" aria-label="会话过滤">
        <button type="button" className="conversation-filter-tab conversation-filter-tab--active">
          全部 5
        </button>
        <button type="button" className="conversation-filter-tab">
          活跃 2
        </button>
        <button type="button" className="conversation-filter-tab">
          最近
        </button>
      </div>
      <div className="conversation-session-list__scroll">
        {sessionGroups.map((group) => (
          <section key={group.label} className="conversation-session-group">
            <span className="conversation-session-group__label">{group.label}</span>
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={
                  item.id === selectedSessionId
                    ? "conversation-session-item conversation-session-item--active"
                    : "conversation-session-item"
                }
                onClick={() => {
                  if (item.surface) {
                    onSessionSurfaceChange?.(item.surface);
                  }
                }}
              >
                <span className="conversation-session-item__avatar" aria-hidden="true">
                  {item.surface === "hermes" ? "H" : item.surface === "openclaw" ? "OC" : item.title.slice(0, 1)}
                </span>
                <span className="conversation-session-item__copy">
                  <strong>{item.title}</strong>
                  <em>{item.meta}</em>
                </span>
                <time>{item.time}</time>
              </button>
            ))}
          </section>
        ))}
      </div>
      <button type="button" className="conversation-view-all" onClick={() => onNavigatePage?.("sessions")}>
        查看全部会话
        <ChevronRight size={15} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </aside>
  );
}

export function SessionHeader({ title, subtitle, chips, onCreateSession, onRefresh }: SessionHeaderProps) {
  return (
    <header className="conversation-header" aria-label="会话顶部状态">
      <div className="conversation-header__identity">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <ChatStatusChips chips={chips} />
      <div className="conversation-header__actions">
        <button type="button" className="conversation-action-button" aria-label="顶部新建会话" onClick={onCreateSession}>
          <Plus size={15} strokeWidth={2.4} aria-hidden="true" />
          新建会话
        </button>
        <button type="button" className="conversation-icon-button" aria-label="刷新" title="刷新" onClick={onRefresh}>
          <RefreshCw size={16} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

export function ChatPanel({ title, subtitle, statusChips, contextChips, children, composer, chart }: ChatPanelProps) {
  return (
    <article className="conversation-chat-panel" aria-label={title}>
      <div className="conversation-chat-panel__top">
        <div className="conversation-chat-panel__title">
          <span>会话流</span>
          <strong>{title}</strong>
          <em>{subtitle}</em>
        </div>
        <div className="conversation-chat-panel__chips">
          <ChatStatusChips chips={statusChips} />
          <ChatStatusChips chips={contextChips} compact />
        </div>
      </div>
      {chart}
      <div className="conversation-chat-panel__timeline">{children}</div>
      {composer}
    </article>
  );
}

export function ChatStatusChips({ chips, compact = false }: { chips: ConversationChip[]; compact?: boolean }) {
  return (
    <div className={compact ? "conversation-chip-strip conversation-chip-strip--compact" : "conversation-chip-strip"}>
      {chips.map((chip) => (
        <span key={`${chip.label}-${chip.tone ?? "neutral"}`} className={`conversation-chip conversation-chip--${chip.tone ?? "neutral"}`}>
          {chip.label}
        </span>
      ))}
    </div>
  );
}

export function MessageTimeline({
  threadId,
  loading,
  emptyTitle,
  emptyDescription,
  waitingNotice,
  children,
  detachedFromLatest,
  onJumpToLatest
}: MessageTimelineProps) {
  return (
    <section className="conversation-timeline-shell" aria-label="消息时间线">
      {waitingNotice ? <div className="conversation-connection-notice">{waitingNotice}</div> : null}
      <div id={threadId} className="conversation-timeline" role="log" aria-live="polite">
        {loading ? (
          <div className="conversation-empty-state">
            <strong>正在读取会话记录</strong>
            <p>{emptyDescription}</p>
          </div>
        ) : children ? (
          children
        ) : (
          <div className="conversation-empty-state">
            <strong>{emptyTitle}</strong>
            <p>{emptyDescription}</p>
          </div>
        )}
      </div>
      {detachedFromLatest ? (
        <div className="conversation-timeline-shell__jump">
          <button type="button" className="conversation-action-button conversation-action-button--primary" onClick={onJumpToLatest}>
            回到底部看最新回复
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function MessageBubble({ role, roleLabel, timeLabel, text, grouped, deliveryStatus, onRetry }: MessageBubbleProps) {
  return (
    <article
      className={[
        "conversation-message",
        `conversation-message--${role === "user" ? "user" : role === "assistant" ? "assistant" : "system"}`,
        grouped ? "conversation-message--grouped" : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {!grouped ? (
        <div className="conversation-message__header">
          <span className="conversation-message__role">
            <span className="conversation-message__avatar" aria-hidden="true">
              {role === "user" ? "U" : role === "assistant" ? "AI" : "S"}
            </span>
            {roleLabel}
          </span>
          <time>{timeLabel}</time>
        </div>
      ) : null}
      <div className="conversation-message__body">{text}</div>
      {deliveryStatus ? (
        <div className="conversation-message__meta">
          <span className={`conversation-message__delivery conversation-message__delivery--${deliveryStatus}`}>
            {deliveryStatus === "pending" ? "发送中..." : "发送失败"}
          </span>
          {deliveryStatus === "failed" && onRetry ? (
            <button type="button" className="conversation-mini-button" onClick={onRetry}>
              重试发送
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function ComposerBar({
  value,
  placeholder,
  disabled,
  canSend,
  submitting,
  submitLabel,
  submittingLabel,
  statusLabel,
  helperText,
  presets: _presets,
  errors = [],
  result,
  onValueChange,
  onSubmit,
  onClear,
  onPresetSelect: _onPresetSelect,
  onKeyDown
}: ComposerBarProps) {
  const visibleErrors = errors.filter((item): item is string => Boolean(item));
  return (
    <footer className="conversation-composer" aria-label="消息输入区">
      {visibleErrors.map((error) => (
        <div key={error} className="conversation-error">
          {error}
        </div>
      ))}
      {result}
      <div className="conversation-composer__input-row">
        <textarea
          value={value}
          placeholder={placeholder}
          rows={3}
          disabled={disabled}
          onChange={(event: { target: { value: string } }) => onValueChange(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <button type="button" className="conversation-send-button" onClick={onSubmit} disabled={!canSend}>
          <Send size={18} strokeWidth={2.4} aria-hidden="true" />
          <span>{submitting ? submittingLabel : submitLabel}</span>
        </button>
      </div>
      <div className="conversation-composer__footer">
        <span>{helperText}</span>
        <em>{statusLabel}</em>
        <button type="button" onClick={onClear} disabled={submitting || value.length === 0}>
          清空输入
        </button>
      </div>
    </footer>
  );
}

export function InspectorPanel({ children }: { children: ReactNode }) {
  return (
    <aside className="conversation-inspector" aria-label="右侧检查器">
      {children}
    </aside>
  );
}

export function ModelRouteCard({ title, currentModel, secondaryModel, routeStrategy, result, children }: ModelRouteCardProps) {
  return (
    <section className="conversation-inspector-card">
      <CardTitle icon={<Bot size={16} strokeWidth={2.2} aria-hidden="true" />} title="模型与路由" meta={title} />
      <div className="conversation-inspector-list">
        <MetricLine label="当前模型" value={currentModel} />
        <MetricLine label="备用模型" value={secondaryModel} />
        <MetricLine label="路由策略" value={routeStrategy} />
      </div>
      {children}
      {result}
    </section>
  );
}

export function ContextTokenCard({ contextLabel, progress, rows }: ContextTokenCardProps) {
  const boundedProgress = Math.max(0, Math.min(100, progress));
  return (
    <section className="conversation-inspector-card">
      <CardTitle icon={<Gauge size={16} strokeWidth={2.2} aria-hidden="true" />} title="令牌与上下文" meta={contextLabel} />
      <div className="conversation-progress">
        <div
          className="conversation-progress__ring"
          style={{
            background: `radial-gradient(circle at center, var(--bg-card) 0 56%, transparent 57%), conic-gradient(var(--cyan) ${boundedProgress}%, rgba(148, 163, 184, 0.18) 0)`
          }}
        >
          <strong>{boundedProgress}%</strong>
        </div>
        <div>
          <span>上下文窗口</span>
          <strong>{contextLabel}</strong>
        </div>
      </div>
      <div className="conversation-token-grid">
        {rows.map((row) => (
          <MetricLine key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
    </section>
  );
}

export function GatewayControlCard({ openclawStatus, hermesStatus, openclawLatency, hermesLatency, result, children }: GatewayControlCardProps) {
  return (
    <section className="conversation-inspector-card">
      <CardTitle icon={<Activity size={16} strokeWidth={2.2} aria-hidden="true" />} title="网关控制" meta="Gateway Control" />
      <div className="conversation-gateway-stack">
        <StatusLine label="OpenClaw Gateway" value={`${openclawStatus} · ${openclawLatency}`} tone={openclawStatus.includes("运行") ? "positive" : "warning"} />
        <StatusLine label="Hermes Gateway" value={`${hermesStatus} · ${hermesLatency}`} tone={hermesStatus.includes("运行") ? "positive" : "warning"} />
      </div>
      {children}
      {result}
    </section>
  );
}

export function SessionActionsCard({ status, canSendLabel, result, children }: SessionActionsCardProps) {
  return (
    <section className="conversation-inspector-card">
      <CardTitle icon={<Archive size={16} strokeWidth={2.2} aria-hidden="true" />} title="会话操作" meta={status} />
      <div className="conversation-inspector-list">
        <MetricLine label="会话状态" value={status} />
        <MetricLine label="发送状态" value={canSendLabel} />
      </div>
      {children}
      {result}
    </section>
  );
}

export function LatencyTrendCard() {
  const points = "0,52 38,44 76,48 114,30 152,34 190,22 228,28 266,18 304,24";
  return (
    <section className="conversation-latency-card" aria-label="延迟趋势近 24 小时">
      <div className="conversation-latency-card__header">
        <div>
          <span>延迟趋势</span>
          <strong>近 24 小时</strong>
        </div>
        <em>平均 1086ms</em>
      </div>
      <svg viewBox="0 0 304 64" preserveAspectRatio="none" role="img" aria-label="延迟趋势 mock chart">
        <path d="M0 60 H304" />
        <path d="M0 38 H304" />
        <path d={`M${points}`} className="conversation-latency-card__line" />
        <path d={`M${points} L304 64 L0 64 Z`} className="conversation-latency-card__area" />
      </svg>
    </section>
  );
}

function CardTitle({ icon, title, meta }: { icon: ReactNode; title: string; meta: string }) {
  return (
    <div className="conversation-card-title">
      <span className="conversation-card-title__icon">{icon}</span>
      <div>
        <strong>{title}</strong>
        <em>{meta}</em>
      </div>
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="conversation-metric-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusLine({ label, value, tone }: { label: string; value: string; tone: "positive" | "warning" | "danger" }) {
  return (
    <div className={`conversation-status-line conversation-status-line--${tone}`}>
      <span className="conversation-status-line__dot" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
