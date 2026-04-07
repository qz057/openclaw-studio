import type { StudioCommandAction, StudioKeyboardShortcut, StudioTone } from "@openclaw/shared";

export type ContextualCommandStepState = "completed" | "next" | "pending";

export interface ContextualCommandStep {
  id: string;
  label: string;
  detail: string;
  state: ContextualCommandStepState;
  tone: StudioTone;
}

export interface ContextualCommandStateLine {
  id: string;
  label: string;
  value: string;
  tone: StudioTone;
}

export interface ContextualCommandNextStepItem {
  id: string;
  label: string;
  detail: string;
  tone: StudioTone;
  action: StudioCommandAction | null;
}

export interface ContextualCommandHistoryEntry {
  id: string;
  label: string;
  detail: string;
  safety: StudioCommandAction["safety"];
  timestamp: string;
}

export interface ContextualCommandActionDeckLaneItem {
  id: string;
  label: string;
  detail: string;
  tone: StudioTone;
  active: boolean;
  primaryActionLabel: string;
  followUpActionLabels: string[];
  actionCount: number;
  stageCount: number;
  windowCount: number;
  boardCount: number;
}

export interface ContextualCommandPanelProps {
  eyebrow: string;
  title: string;
  summary: string;
  flowLabel: string;
  flowSummary: string;
  workflowLaneLabel?: string;
  workspaceLabel?: string;
  focusedSlotLabel?: string;
  activeFlowState: ContextualCommandStateLine[];
  actionDeckLabel?: string;
  actionDeckSummary?: string;
  actionDeckLanes: ContextualCommandActionDeckLaneItem[];
  nextStepBoardLabel?: string;
  nextStepBoardSummary?: string;
  nextStepItems: ContextualCommandNextStepItem[];
  historyTitle: string;
  historySummary: string;
  historyEntries: ContextualCommandHistoryEntry[];
  groupLabels?: string[];
  recommendedAction: StudioCommandAction | null;
  followUpActions: StudioCommandAction[];
  steps: ContextualCommandStep[];
  shortcuts: StudioKeyboardShortcut[];
  onRunFlow: () => void;
  onRunAction: (action: StudioCommandAction) => void;
  onRunActionDeckLane?: (laneId: string) => void;
}

function getStepStateLabel(state: ContextualCommandStepState): string {
  switch (state) {
    case "completed":
      return "Completed";
    case "next":
      return "Next";
    default:
      return "Pending";
  }
}

export function ContextualCommandPanel({
  eyebrow,
  title,
  summary,
  flowLabel,
  flowSummary,
  workflowLaneLabel,
  workspaceLabel,
  focusedSlotLabel,
  activeFlowState,
  actionDeckLabel,
  actionDeckSummary,
  actionDeckLanes,
  nextStepBoardLabel,
  nextStepBoardSummary,
  nextStepItems,
  historyTitle,
  historySummary,
  historyEntries,
  groupLabels = [],
  recommendedAction,
  followUpActions,
  steps,
  shortcuts,
  onRunFlow,
  onRunAction,
  onRunActionDeckLane
}: ContextualCommandPanelProps) {
  return (
    <article className="surface card contextual-command-panel">
      <div className="card-header card-header--stack">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{summary}</p>
        </div>
      </div>

      <div className="contextual-command-panel__meta">
        <span className="workflow-chip workflow-chip--active">{flowLabel}</span>
        {workflowLaneLabel ? <span className="workflow-chip workflow-chip--neutral">{workflowLaneLabel}</span> : null}
        {workspaceLabel ? <span className="workflow-chip">{workspaceLabel}</span> : null}
        {focusedSlotLabel ? <span className="workflow-chip">{focusedSlotLabel}</span> : null}
      </div>

      <div className="contextual-command-panel__grid">
        <div className="contextual-command-panel__recommended">
          <span>Recommended Next Action</span>
          <strong>{recommendedAction?.label ?? "Flow already aligned locally"}</strong>
          <p>{recommendedAction?.description ?? flowSummary}</p>
          <button type="button" className="action-button" onClick={onRunFlow}>
            {recommendedAction ? "Advance Flow" : "Refresh Flow"}
          </button>
        </div>

        <div className="contextual-command-panel__state">
          <span>Active Flow State</span>
          <strong>{flowLabel}</strong>
          <p>{flowSummary}</p>
          <div className="contextual-command-panel__state-list">
            {activeFlowState.map((line) => (
              <article key={line.id} className={`contextual-command-state-card contextual-command-state-card--${line.tone}`}>
                <span>{line.label}</span>
                <strong>{line.value}</strong>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="contextual-command-panel__section">
        <div className="contextual-command-panel__section-header">
          <span>Sequence Preview</span>
          <strong>{steps.length} steps</strong>
        </div>
        <div className="contextual-command-panel__step-list">
          {steps.map((step) => (
            <article
              key={step.id}
              className={`contextual-command-step contextual-command-step--${step.tone}${
                step.state === "next" ? " contextual-command-step--next" : ""
              }`}
            >
              <div className="contextual-command-step__meta">
                <span>{getStepStateLabel(step.state)}</span>
                <strong>{step.label}</strong>
              </div>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
      </div>

      {nextStepItems.length ? (
        <div className="contextual-command-panel__section">
          <div className="contextual-command-panel__section-header">
            <span>Route-aware Next-step Board</span>
            <strong>{nextStepBoardLabel ?? "Local orchestration board"}</strong>
          </div>
          <p className="panel-summary panel-summary--tight">{nextStepBoardSummary ?? "Route-aware next steps stay local-only."}</p>
          <div className="contextual-command-panel__next-step-list">
            {nextStepItems.map((item) => (
              <article key={item.id} className={`contextual-command-next-step contextual-command-next-step--${item.tone}`}>
                <div>
                  <span>{item.action?.scope ?? "local-only"}</span>
                  <strong>{item.label}</strong>
                  <p>{item.detail}</p>
                </div>
                {item.action ? (
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => {
                      onRunAction(item.action as StudioCommandAction);
                    }}
                    title={item.action.description}
                  >
                    {item.action.label}
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {actionDeckLanes.length ? (
        <div className="contextual-command-panel__section">
          <div className="contextual-command-panel__section-header">
            <span>Action Deck Orchestration</span>
            <strong>{actionDeckLabel ?? "Review coverage deck"}</strong>
          </div>
          <p className="panel-summary panel-summary--tight">
            {actionDeckSummary ?? "Deck lanes keep delivery-stage and multi-window coverage linked to the same local-only command surface."}
          </p>
          <div className="contextual-command-panel__next-step-list">
            {actionDeckLanes.map((lane) => (
              <article key={lane.id} className={`contextual-command-next-step contextual-command-next-step--${lane.tone}`}>
                <div>
                  <span>{lane.primaryActionLabel}</span>
                  <strong>{lane.active ? `${lane.label} · Active coverage` : lane.label}</strong>
                  <p>{lane.detail}</p>
                  <div className="contextual-command-panel__chips">
                    <span className={`command-context-pill${lane.active ? " workflow-chip--active" : ""}`}>{lane.actionCount} actions</span>
                    <span className="command-context-pill">{lane.stageCount} stages</span>
                    <span className="command-context-pill">{lane.windowCount} windows</span>
                    <span className="command-context-pill">{lane.boardCount} boards</span>
                    {lane.followUpActionLabels.map((label) => (
                      <span key={`${lane.id}-${label}`} className="command-context-pill">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
                {onRunActionDeckLane ? (
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => {
                      onRunActionDeckLane(lane.id);
                    }}
                    title={lane.detail}
                  >
                    {lane.primaryActionLabel}
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {recommendedAction || followUpActions.length ? (
        <div className="contextual-command-panel__section">
          <div className="contextual-command-panel__section-header">
            <span>Context-sensitive Recommendations</span>
            <strong>{(recommendedAction ? 1 : 0) + followUpActions.length} surfaced</strong>
          </div>
          <div className="action-toolbar">
            {recommendedAction ? (
              <button
                type="button"
                className="action-button"
                onClick={() => {
                  onRunAction(recommendedAction);
                }}
                title={recommendedAction.description}
              >
                {recommendedAction.label}
              </button>
            ) : null}
            {followUpActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="action-button"
                onClick={() => {
                  onRunAction(action);
                }}
                title={action.description}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="contextual-command-panel__section">
        <div className="contextual-command-panel__section-header">
          <span>{historyTitle}</span>
          <strong>{historyEntries.length ? `${historyEntries.length} events` : "No events"}</strong>
        </div>
        <p className="panel-summary panel-summary--tight">{historySummary}</p>
        {historyEntries.length ? (
          <div className="contextual-command-panel__history-list">
            {historyEntries.map((entry) => (
              <article key={entry.id} className="contextual-command-history-card">
                <span>
                  {entry.timestamp} · {entry.safety}
                </span>
                <strong>{entry.label}</strong>
                <p>{entry.detail}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="contextual-command-history-card">
            <span>History</span>
            <strong>Empty</strong>
            <p>No local command history yet.</p>
          </div>
        )}
      </div>

      {groupLabels.length ? (
        <div className="contextual-command-panel__section">
          <div className="contextual-command-panel__section-header">
            <span>Action Groups</span>
            <strong>{groupLabels.length} active</strong>
          </div>
          <div className="contextual-command-panel__chips">
            {groupLabels.map((label) => (
              <span key={label} className="command-context-pill">
                {label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {shortcuts.length ? (
        <div className="contextual-command-panel__section">
          <div className="contextual-command-panel__section-header">
            <span>Keyboard Routing</span>
            <strong>{shortcuts.length} shortcuts</strong>
          </div>
          <div className="contextual-command-panel__chips">
            {shortcuts.map((shortcut) => (
              <span key={shortcut.id} className="command-context-pill">
                {shortcut.combo} · {shortcut.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
