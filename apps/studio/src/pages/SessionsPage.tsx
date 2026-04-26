import type { SessionSummary } from "@openclaw/shared";
import type { WorkbenchSessionFilter } from "../components/workbench-persistence";
import { formatProductText } from "../lib/product-text";

type WorkbenchTone = "positive" | "warning" | "neutral";
type SessionFilter = WorkbenchSessionFilter;

interface WorkbenchAction {
  id: string;
  label: string;
  description: string;
  tone: WorkbenchTone;
  hotkey?: string;
  onTrigger: () => void;
}

interface WorkbenchStatusItem {
  id: string;
  label: string;
  value: string;
  meta?: string;
  tone: WorkbenchTone;
}

interface WorkbenchReadinessMetric {
  id: string;
  label: string;
  value: string;
  meta?: string;
}

interface WorkbenchReadinessCard {
  id: string;
  title: string;
  headline: string;
  summary: string;
  tone: WorkbenchTone;
  metrics: WorkbenchReadinessMetric[];
  actionLabel?: string;
  onOpen?: () => void;
  actions?: WorkbenchAction[];
}

interface WorkflowNode {
  id: string;
  title: string;
  summary: string;
  status: string;
  tone: WorkbenchTone;
  active: boolean;
  onEnter: () => void;
}

interface SessionsPageProps {
  sessions: SessionSummary[];
  primaryActions: WorkbenchAction[];
  statusItems: WorkbenchStatusItem[];
  readinessCards: WorkbenchReadinessCard[];
  workflowNodes: WorkflowNode[];
  nextActionPrimary: WorkbenchAction | null;
  nextActionSecondary: WorkbenchAction[];
  nextActionSummary: string;
  quickLaunchActions: WorkbenchAction[];
  selectedSessionId: string | null;
  sessionFilter: SessionFilter;
  onSessionAction: (session: SessionSummary) => void;
  onSessionFilterChange: (filter: SessionFilter) => void;
}

const FILTER_LABELS: Record<SessionFilter, string> = {
  all: "全部",
  active: "进行中",
  waiting: "待复核",
  complete: "已完成"
};

function translateActionLabel(label: string): string {
  const map: Record<string, string> = {
    "Open Home": "打开总览",
    "Inspect Boundary Contract": "检查边界契约",
    "Show Focused Slot Trace": "查看聚焦槽位追踪",
    "Focus Lane Apply Slot": "聚焦应用槽位",
    "Activate Review Deck View": "进入审查台",
    "Activate Operator Shell View": "进入操作壳层",
    "Activate Trace Deck View": "进入轨迹台",
    "Advance Current Workflow Lane": "推进当前流程",
    "Open Command Palette": "打开命令面板",
    "Resume Last Work": "恢复上次工作",
    "Open Sessions": "打开工作台",
    "Resume Last Workspace": "恢复上次工作区",
    "Restore Remembered Page": "恢复记忆页面",
    "Focus Last Focused Slot": "聚焦上次槽位",
    "Focus Active Review Surface": "聚焦当前审查面",
    "Restore Latest Handoff": "恢复最近交接",
    "Inspect Cross-window Observability": "检查跨窗口可观测链"
  };

  return map[label] ?? formatProductText(label);
}

function getActionGlyph(label: string, tone: WorkbenchTone): string {
  const normalized = label.toLowerCase();

  if (normalized.includes("home")) return "⌂";
  if (normalized.includes("boundary")) return "◎";
  if (normalized.includes("trace")) return "↗";
  if (normalized.includes("lane")) return "⇢";
  if (normalized.includes("review")) return "▣";
  if (normalized.includes("恢复") || normalized.includes("resume")) return "↺";
  if (tone === "warning") return "!";
  if (tone === "positive") return "●";
  return "•";
}

function getSessionStatusLabel(status: SessionSummary["status"]): string {
  switch (status) {
    case "active":
      return "进行中";
    case "waiting":
      return "待复核";
    default:
      return "已完成";
  }
}

function getSessionPrimaryLabel(status: SessionSummary["status"]): string {
  switch (status) {
    case "active":
      return "继续";
    case "waiting":
      return "查看";
    default:
      return "打开";
  }
}

function deriveSessionStage(session: SessionSummary): string {
  const haystack = `${session.title} ${session.workspace}`.toLowerCase();

  if (haystack.includes("bootstrap") || haystack.includes("launch") || haystack.includes("start")) {
    return "初始化";
  }

  if (haystack.includes("review") || haystack.includes("boundary") || haystack.includes("bridge")) {
    return "复核中";
  }

  if (haystack.includes("layout") || haystack.includes("renderer") || haystack.includes("ui")) {
    return "界面整理";
  }

  if (haystack.includes("trace")) {
    return "链路追踪";
  }

  if (session.status === "active") {
    return "流程推进";
  }

  if (session.status === "waiting") {
    return "等待处理";
  }

  return "收口归档";
}

function toneClassName(tone: WorkbenchTone): string {
  return `workbench-tone--${tone}`;
}

function getActionFamily(label: string): string {
  const normalized = `${label} ${translateActionLabel(label)}`.toLowerCase();

  if (normalized.includes("resume") || normalized.includes("restore") || normalized.includes("恢复")) {
    return "resume";
  }

  if (normalized.includes("focus") || normalized.includes("聚焦")) {
    return "focus";
  }

  if (normalized.includes("handoff") || normalized.includes("交接")) {
    return "handoff";
  }

  if (normalized.includes("command") || normalized.includes("命令面板")) {
    return "command";
  }

  if (normalized.includes("home")) {
    return "home";
  }

  if (normalized.includes("session") || normalized.includes("工作台")) {
    return "sessions";
  }

  if (normalized.includes("review") || normalized.includes("复核")) {
    return "review";
  }

  return normalized;
}

function selectCondensedActions(actions: WorkbenchAction[], limit: number): WorkbenchAction[] {
  const seen = new Set<string>();
  const selected: WorkbenchAction[] = [];

  for (const action of actions) {
    const family = getActionFamily(action.label);

    if (seen.has(family)) {
      continue;
    }

    seen.add(family);
    selected.push(action);

    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
}

function EnvironmentStatusBar({ items }: { items: WorkbenchStatusItem[] }) {
  return (
    <article className="workbench-statusbar surface card">
      <div className="workbench-statusbar__items" role="list" aria-label="环境状态条">
        {items.map((item, index) => (
          <div key={item.id} className={`workbench-statusbar__item ${toneClassName(item.tone)}`} role="listitem">
            <span className="workbench-statusbar__label">{formatProductText(item.label)}</span>
            <strong className="workbench-statusbar__value">{formatProductText(item.value)}</strong>
            {item.meta ? <em className="workbench-statusbar__meta-text">{formatProductText(item.meta)}</em> : null}
            {index < items.length - 1 ? <i className="workbench-statusbar__divider" aria-hidden="true" /> : null}
          </div>
        ))}
      </div>
    </article>
  );
}

function CurrentWorkflowCard({ nodes }: { nodes: WorkflowNode[] }) {
  return (
    <article className="workbench-panel surface card">
      <div className="card-header card-header--stack workbench-section-header">
        <div>
          <p className="eyebrow">当前流程</p>
          <h2>操作壳层 → 轨迹台 → 审查台</h2>
        </div>
        <p>按流程查看当前锚点、追踪位与复核位，把状态与入口放在同一条主链上。</p>
      </div>

      <div className="workflow-lane-v2">
        {nodes.map((node, index) => (
          <div key={node.id} className={`workflow-node-v2 workflow-node-v2--${node.tone} ${node.active ? "workflow-node-v2--active" : ""}`}>
            <div className="workflow-node-v2__rail">
              <span className={`workflow-node-v2__dot ${toneClassName(node.tone)}`} />
              {index < nodes.length - 1 ? <span className="workflow-node-v2__line" /> : null}
            </div>
            <div className="workflow-node-v2__content">
              <div className="workflow-node-v2__header">
                <div>
              <strong>{formatProductText(node.title)}</strong>
                  <span className="workflow-node-v2__state-label">{node.active ? "当前节点" : "流程节点"}</span>
                </div>
                <span className={`status-chip status-chip--${node.active ? "active" : node.tone === "warning" ? "waiting" : node.tone === "positive" ? "complete" : "recent"}`}>
                  {node.status}
                </span>
              </div>
              <p>{formatProductText(node.summary)}</p>
              <button type="button" className="secondary-button workbench-inline-action" onClick={node.onEnter}>
                进入 {formatProductText(node.title)}
              </button>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function NextActionPanel({
  primaryAction,
  secondaryActions,
  summary
}: {
  primaryAction: WorkbenchAction | null;
  secondaryActions: WorkbenchAction[];
  summary: string;
}) {
  const suggestions = [primaryAction, ...secondaryActions.slice(0, 2)].filter((action): action is WorkbenchAction => Boolean(action));

  return (
    <article className="workbench-panel surface card">
      <div className="card-header card-header--stack workbench-section-header">
        <div>
          <p className="eyebrow">建议下一步</p>
          <h2>{primaryAction ? translateActionLabel(primaryAction.label) : "先打开命令面板"}</h2>
        </div>
        <p>{formatProductText(summary)}</p>
      </div>

      <div className="workbench-suggestion-list">
        {suggestions.map((action, index) => (
          <div
            key={action.id}
            className={`workbench-suggestion-card ${index === 0 ? "workbench-suggestion-card--primary" : ""} workbench-suggestion-card--${action.tone}`}
          >
            <span className="workbench-suggestion-card__index">0{index + 1}</span>
            <div className="workbench-suggestion-card__body">
              <strong>{translateActionLabel(action.label)}</strong>
              <p>{formatProductText(action.description)}</p>
            </div>
            <button type="button" className={index === 0 ? "quick-action-button quick-action-button--primary" : "secondary-button"} onClick={action.onTrigger}>
              {index === 0 ? "立即进入" : "执行"}
            </button>
          </div>
        ))}
      </div>
    </article>
  );
}

function ExecutionReadinessSnapshot({ cards }: { cards: WorkbenchReadinessCard[] }) {
  return (
    <article className="workbench-panel surface card">
      <div className="card-header card-header--stack workbench-section-header">
        <div>
          <p className="eyebrow">执行就绪快照</p>
          <h2>当前执行就绪快照</h2>
        </div>
        <p>把聚焦槽位交接、交付锚点、审查收口和恢复锚点放进同一眼可读的工作台首页。</p>
      </div>

      <div className="workbench-readiness-grid">
        {cards.map((card) => (
          <article key={card.id} className={`workbench-readiness-card workbench-readiness-card--${card.tone}`}>
            <div className="workbench-readiness-card__header">
              <div>
                <span className="workbench-readiness-card__eyebrow">{formatProductText(card.title)}</span>
                <strong>{formatProductText(card.headline)}</strong>
              </div>
              <span className={`status-chip status-chip--${card.tone === "positive" ? "complete" : card.tone === "warning" ? "waiting" : "recent"}`}>
                {card.tone === "positive" ? "已就绪" : card.tone === "warning" ? "需复核" : "观察中"}
              </span>
            </div>
            <p>{formatProductText(card.summary)}</p>
            <div className="workbench-readiness-card__metrics">
              {card.metrics.map((metric) => (
                <article key={metric.id} className="workbench-readiness-card__metric">
                  <span>{formatProductText(metric.label)}</span>
                  <strong>{formatProductText(metric.value)}</strong>
                  {metric.meta ? <p>{formatProductText(metric.meta)}</p> : null}
                </article>
              ))}
            </div>
            {card.actions?.length ? (
              <div className="workbench-readiness-card__actions">
                {card.actions.map((action, index) => (
                  <button
                    key={action.id}
                    type="button"
                    className={index === 0 ? "quick-action-button quick-action-button--primary" : "secondary-button"}
                    onClick={action.onTrigger}
                  >
                    {translateActionLabel(action.label)}
                  </button>
                ))}
              </div>
            ) : card.onOpen ? (
              <button type="button" className="secondary-button workbench-inline-action" onClick={card.onOpen}>
                {formatProductText(card.actionLabel, "查看详情")}
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </article>
  );
}

function QuickLaunchGrid({ actions }: { actions: WorkbenchAction[] }) {
  return (
    <article className="workbench-panel surface card">
      <div className="table-header workbench-section-header workbench-section-header--inline">
        <div>
          <h2>快速启动</h2>
          <p className="panel-summary">高频动作入口，用于直接跳转或接着干。</p>
        </div>
        <span>动作集合</span>
      </div>
      <div className="quick-launch-grid-v2">
        {actions.map((action) => (
          <button key={action.id} type="button" className={`workbench-action-card workbench-action-card--${action.tone}`} onClick={action.onTrigger}>
            <div className="workbench-action-card__icon">{getActionGlyph(action.label, action.tone)}</div>
            <div className="workbench-action-card__body">
              <span>{action.hotkey ?? "动作入口"}</span>
              <strong>{translateActionLabel(action.label)}</strong>
              <p>{formatProductText(action.description)}</p>
            </div>
          </button>
        ))}
      </div>
    </article>
  );
}

function RecentSessionsList({
  sessions,
  selectedSessionId,
  sessionFilter,
  onSessionAction,
  onSessionFilterChange
}: {
  sessions: SessionSummary[];
  selectedSessionId: string | null;
  sessionFilter: SessionFilter;
  onSessionAction: (session: SessionSummary) => void;
  onSessionFilterChange: (filter: SessionFilter) => void;
}) {
  const filteredSessions =
    sessionFilter === "all" ? sessions : sessions.filter((session: SessionSummary) => session.status === sessionFilter);

  return (
    <article className="workbench-panel surface card">
      <div className="table-header table-header--stack-on-mobile workbench-section-header workbench-section-header--inline">
        <div>
          <h2>最近会话</h2>
          <p className="panel-summary">优先显示可继续、可复核、可回看的最近工作记录。</p>
        </div>
        <div className="session-filterbar">
          {(Object.keys(FILTER_LABELS) as SessionFilter[]).map((entry) => (
            <button
              key={entry}
              type="button"
              className={entry === sessionFilter ? "shell-tab shell-tab--active" : "shell-tab"}
              onClick={() => {
                onSessionFilterChange(entry);
              }}
            >
              {FILTER_LABELS[entry]}
            </button>
          ))}
        </div>
      </div>

      <div className="recent-session-list">
        {filteredSessions.map((session) => (
          <article
            key={session.id}
            className={session.id === selectedSessionId ? "recent-session-row recent-session-row--selected" : "recent-session-row"}
            tabIndex={0}
            onClick={() => {
              onSessionAction(session);
            }}
            onKeyDown={(event: KeyboardEvent) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSessionAction(session);
              }
            }}
          >
            <div className="recent-session-row__title">
              <strong>{formatProductText(session.title)}</strong>
              <p>
                {session.workspace} · {session.owner}
              </p>
            </div>
            <div className="recent-session-row__stage">
              <span>当前阶段</span>
              <strong>{deriveSessionStage(session)}</strong>
            </div>
            <div className="recent-session-row__status">
              <span className={`status-chip status-chip--${session.status}`}>{getSessionStatusLabel(session.status)}</span>
              <p>{formatProductText(session.updatedAt)}</p>
            </div>
            <div className="recent-session-row__actions">
              <button
                type="button"
                className="secondary-button"
                onClick={(event: MouseEvent) => {
                  event.stopPropagation();
                  onSessionAction(session);
                }}
              >
                {getSessionPrimaryLabel(session.status)}
              </button>
            </div>
          </article>
        ))}

        {filteredSessions.length === 0 ? (
          <div className="placeholder-block workbench-empty-state">
            <strong>当前筛选下暂无会话</strong>
            <p>可以切换筛选，或直接从上方“快速启动”发起新的流程。</p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function SessionsPage({
  sessions,
  primaryActions,
  statusItems,
  readinessCards,
  workflowNodes,
  nextActionPrimary,
  nextActionSecondary,
  nextActionSummary,
  quickLaunchActions,
  selectedSessionId,
  sessionFilter,
  onSessionAction,
  onSessionFilterChange
}: SessionsPageProps) {
  const headerActions = selectCondensedActions(primaryActions, 3);

  return (
    <section className="page workbench-page">
      <div className="page-header workbench-page__header">
        <div className="workbench-page__headline">
          <p className="eyebrow">工作台首页</p>
          <h1>工作台</h1>
          <p className="page-summary">继续当前任务，或启动新的流程</p>
        </div>
        <div className="workbench-page__actions">
          {headerActions.map((action, index) => (
            <button
              key={action.id}
              type="button"
              className={index === 0 ? "workbench-header-action workbench-header-action--primary" : "workbench-header-action"}
              onClick={action.onTrigger}
            >
              <strong>{translateActionLabel(action.label)}</strong>
              <span>{formatProductText(action.description)}</span>
            </button>
          ))}
        </div>
      </div>

      <EnvironmentStatusBar items={statusItems} />

      <div className="workbench-split-grid">
        <CurrentWorkflowCard nodes={workflowNodes} />
        <NextActionPanel primaryAction={nextActionPrimary} secondaryActions={nextActionSecondary} summary={nextActionSummary} />
      </div>

      <RecentSessionsList
        sessions={sessions}
        selectedSessionId={selectedSessionId}
        sessionFilter={sessionFilter}
        onSessionAction={onSessionAction}
        onSessionFilterChange={onSessionFilterChange}
      />
      <QuickLaunchGrid actions={quickLaunchActions} />
      <ExecutionReadinessSnapshot cards={readinessCards} />
    </section>
  );
}
