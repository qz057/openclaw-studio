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
  reviewSurfaceCount: number;
  companionRouteStateCount: number;
  companionSequenceCount: number;
  companionPathCount: number;
}

export interface ContextualCommandReviewSurfaceItem {
  id: string;
  label: string;
  detail: string;
  tone: StudioTone;
  active: boolean;
  kindLabel: string;
  coverageLabel: string;
  action: StudioCommandAction;
}

export interface ContextualCommandCompanionSequenceStepItem {
  id: string;
  label: string;
  detail: string;
  tone: StudioTone;
  active: boolean;
  roleLabel: string;
  stepLabel: string;
  coverageLabel: string;
  pathLabel: string;
  action: StudioCommandAction | null;
}

export interface ContextualCommandCompanionSequenceItem {
  id: string;
  label: string;
  detail: string;
  tone: StudioTone;
  active: boolean;
  stepCount: number;
  coverageLabel: string;
  routeLabel: string;
  action: StudioCommandAction | null;
}

export interface ContextualCommandCompanionRouteStateSwitchItem {
  id: string;
  label: string;
  detail: string;
  tone: StudioTone;
  postureLabel: string;
  action: StudioCommandAction | null;
}

export interface ContextualCommandCompanionRouteStateItem {
  id: string;
  label: string;
  detail: string;
  tone: StudioTone;
  active: boolean;
  postureLabel: string;
  sequenceLabel: string;
  coverageLabel: string;
  pathLabel: string;
  routeLabel: string;
  switchItems: ContextualCommandCompanionRouteStateSwitchItem[];
  action: StudioCommandAction | null;
}

export interface ContextualCommandCompanionRouteHistoryItem {
  id: string;
  label: string;
  detail: string;
  tone: StudioTone;
  active: boolean;
  transitionLabel: string;
  coverageLabel: string;
  routeLabel: string;
  pathLabel: string;
  sequenceLabel?: string;
  timestamp: string;
  action: StudioCommandAction | null;
}

export interface ContextualCommandCompanionReviewPathItem {
  id: string;
  label: string;
  detail: string;
  tone: StudioTone;
  active: boolean;
  kindLabel: string;
  sourceLabel: string;
  primaryActionLabel: string;
  followUpActionLabels: string[];
  coverageLabel: string;
  pathLabel: string;
  routeLabel: string;
  sequenceLabel?: string;
  action: StudioCommandAction | null;
}

export interface ContextualCommandMultiWindowCoverageItem {
  id: string;
  label: string;
  detail: string;
  tone: StudioTone;
  active: boolean;
  relationshipLabel: string;
  coverageLabel: string;
  pathLabel: string;
  reviewSurfaceCount: number;
  reviewSurfaceLabels: string[];
  action: StudioCommandAction | null;
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
  reviewSurfaceItems: ContextualCommandReviewSurfaceItem[];
  companionRouteStatesLabel?: string;
  companionRouteStatesSummary?: string;
  companionRouteStateItems: ContextualCommandCompanionRouteStateItem[];
  companionRouteHistoryLabel?: string;
  companionRouteHistorySummary?: string;
  companionRouteHistoryItems: ContextualCommandCompanionRouteHistoryItem[];
  companionSequenceLabel?: string;
  companionSequenceSummary?: string;
  companionSequenceItems: ContextualCommandCompanionSequenceItem[];
  companionSequenceStepItems: ContextualCommandCompanionSequenceStepItem[];
  companionReviewPathsLabel?: string;
  companionReviewPathsSummary?: string;
  companionReviewPathItems: ContextualCommandCompanionReviewPathItem[];
  multiWindowCoverageLabel?: string;
  multiWindowCoverageSummary?: string;
  multiWindowCoverageItems: ContextualCommandMultiWindowCoverageItem[];
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
  onRunCompanionRouteHistory?: (entryId: string) => void;
  onRunCompanionSequence?: (sequenceId: string) => void;
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
  reviewSurfaceItems,
  companionRouteStatesLabel,
  companionRouteStatesSummary,
  companionRouteStateItems,
  companionRouteHistoryLabel,
  companionRouteHistorySummary,
  companionRouteHistoryItems,
  companionSequenceLabel,
  companionSequenceSummary,
  companionSequenceItems,
  companionSequenceStepItems,
  companionReviewPathsLabel,
  companionReviewPathsSummary,
  companionReviewPathItems,
  multiWindowCoverageLabel,
  multiWindowCoverageSummary,
  multiWindowCoverageItems,
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
  onRunActionDeckLane,
  onRunCompanionRouteHistory,
  onRunCompanionSequence
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
                    <span className="command-context-pill">{lane.reviewSurfaceCount} review surfaces</span>
                    <span className="command-context-pill">{lane.companionRouteStateCount} route states</span>
                    <span className="command-context-pill">{lane.companionSequenceCount} companion sequences</span>
                    <span className="command-context-pill">{lane.companionPathCount} companion paths</span>
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

      {reviewSurfaceItems.length ? (
        <div className="contextual-command-panel__section">
          <div className="contextual-command-panel__section-header">
            <span>Review Surface Navigator</span>
            <strong>{reviewSurfaceItems.length} surfaced</strong>
          </div>
          <p className="panel-summary panel-summary--tight">
            Coverage actions now focus a typed review surface and move delivery stage, window, shared-state lane, board, and observability linkage together.
          </p>
          <div className="contextual-command-panel__next-step-list">
            {reviewSurfaceItems.map((item) => (
              <article key={item.id} className={`contextual-command-next-step contextual-command-next-step--${item.tone}`}>
                <div>
                  <span>{item.kindLabel}</span>
                  <strong>{item.active ? `${item.label} · Active surface` : item.label}</strong>
                  <p>{item.detail}</p>
                  <div className="contextual-command-panel__chips">
                    <span className={`command-context-pill${item.active ? " workflow-chip--active" : ""}`}>{item.coverageLabel}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="action-button"
                  onClick={() => {
                    onRunAction(item.action);
                  }}
                  title={item.action.description}
                >
                  {item.action.label}
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {multiWindowCoverageItems.length ? (
        <div className="contextual-command-panel__section">
          <div className="contextual-command-panel__section-header">
            <span>Multi-window Review Coverage</span>
            <strong>{multiWindowCoverageLabel ?? `${multiWindowCoverageItems.length} mapped paths`}</strong>
          </div>
          <p className="panel-summary panel-summary--tight">
            {multiWindowCoverageSummary ??
              "The active review-surface lane now keeps companion window, shared-state lane, orchestration board, and observability paths visible together."}
          </p>
          <div className="contextual-command-panel__next-step-list">
            {multiWindowCoverageItems.map((item) => (
              <article key={item.id} className={`contextual-command-next-step contextual-command-next-step--${item.tone}`}>
                <div>
                  <span>{item.relationshipLabel}</span>
                  <strong>{item.active ? `${item.label} · Active path` : item.label}</strong>
                  <p>{item.detail}</p>
                  <div className="contextual-command-panel__chips">
                    <span className={`command-context-pill${item.active ? " workflow-chip--active" : ""}`}>{item.coverageLabel}</span>
                    <span className="command-context-pill">{item.pathLabel}</span>
                    <span className="command-context-pill">{item.reviewSurfaceCount} review surfaces</span>
                    {item.reviewSurfaceLabels.map((label) => (
                      <span key={`${item.id}-${label}`} className="command-context-pill">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
                {item.action ? (
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => {
                      if (onRunCompanionRouteHistory) {
                        onRunCompanionRouteHistory(item.id);
                        return;
                      }

                      onRunAction(item.action as StudioCommandAction);
                    }}
                    title={item.action.description}
                  >
                    {item.active ? "Refresh coverage" : "Focus coverage"}
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {companionRouteStateItems.length ? (
        <div className="contextual-command-panel__section">
          <div className="contextual-command-panel__section-header">
            <span>Companion Route State</span>
            <strong>{companionRouteStatesLabel ?? `${companionRouteStateItems.length} explicit routes`}</strong>
          </div>
          <p className="panel-summary panel-summary--tight">
            {companionRouteStatesSummary ??
              "The current review surface now resolves through an explicit companion route state so active route, alternate routes, and switchable sequences stay visible together."}
          </p>
          <div className="contextual-command-panel__next-step-list">
            {companionRouteStateItems.map((item) => (
              <article key={item.id} className={`contextual-command-next-step contextual-command-next-step--${item.tone}`}>
                <div>
                  <span>{item.postureLabel}</span>
                  <strong>{item.active ? `${item.label} · Active route` : item.label}</strong>
                  <p>{item.detail}</p>
                  <div className="contextual-command-panel__chips">
                    <span className={`command-context-pill${item.active ? " workflow-chip--active" : ""}`}>{item.sequenceLabel}</span>
                    <span className="command-context-pill">{item.coverageLabel}</span>
                    <span className="command-context-pill">{item.pathLabel}</span>
                    <span className="command-context-pill">{item.routeLabel}</span>
                    {item.switchItems.map((switchItem) => (
                      <span key={switchItem.id} className="command-context-pill">
                        {switchItem.postureLabel}: {switchItem.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="action-toolbar">
                  {item.action ? (
                    <button
                      type="button"
                      className="action-button"
                      onClick={() => {
                        onRunAction(item.action as StudioCommandAction);
                      }}
                      title={item.action.description}
                    >
                      {item.active ? "Refresh route" : "Focus route"}
                    </button>
                  ) : null}
                  {item.switchItems
                    .filter((switchItem) => switchItem.action && switchItem.action.id !== item.action?.id)
                    .map((switchItem) => (
                      <button
                        key={switchItem.id}
                        type="button"
                        className="action-button"
                        onClick={() => {
                          onRunAction(switchItem.action as StudioCommandAction);
                        }}
                        title={switchItem.detail}
                      >
                        {switchItem.label}
                      </button>
                    ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {companionRouteHistoryItems.length ? (
        <div className="contextual-command-panel__section">
          <div className="contextual-command-panel__section-header">
            <span>Companion Route History</span>
            <strong>{companionRouteHistoryLabel ?? `${companionRouteHistoryItems.length} remembered handoffs`}</strong>
          </div>
          <p className="panel-summary panel-summary--tight">
            {companionRouteHistorySummary ??
              "Recent companion handoffs stay remembered so returning to the same review lane restores the last route, sequence, and review-surface posture instead of recomputing it from scratch."}
          </p>
          <div className="contextual-command-panel__next-step-list">
            {companionRouteHistoryItems.map((item) => (
              <article key={item.id} className={`contextual-command-next-step contextual-command-next-step--${item.tone}`}>
                <div>
                  <span>{item.timestamp}</span>
                  <strong>{item.active ? `${item.label} · Active memory` : item.label}</strong>
                  <p>{item.detail}</p>
                  <div className="contextual-command-panel__chips">
                    <span className={`command-context-pill${item.active ? " workflow-chip--active" : ""}`}>{item.transitionLabel}</span>
                    <span className="command-context-pill">{item.coverageLabel}</span>
                    <span className="command-context-pill">{item.routeLabel}</span>
                    <span className="command-context-pill">{item.pathLabel}</span>
                    {item.sequenceLabel ? <span className="command-context-pill">{item.sequenceLabel}</span> : null}
                  </div>
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
                    {item.active ? "Refresh handoff" : "Resume handoff"}
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {companionSequenceStepItems.length ? (
        <div className="contextual-command-panel__section">
          <div className="contextual-command-panel__section-header">
            <span>Companion Sequence Navigator</span>
            <strong>{companionSequenceLabel ?? `${companionSequenceStepItems.length} ordered steps`}</strong>
          </div>
          <p className="panel-summary panel-summary--tight">
            {companionSequenceSummary ??
              "The current review surface now resolves through an ordered companion sequence so current, primary, and follow-up coverage stay visibly sequenced."}
          </p>
          {companionSequenceItems.length > 1 ? (
            <div className="contextual-command-panel__next-step-list">
              {companionSequenceItems.map((item) => (
                <article key={item.id} className={`contextual-command-next-step contextual-command-next-step--${item.tone}`}>
                  <div>
                    <span>{item.stepCount} steps</span>
                    <strong>{item.active ? `${item.label} · Active sequence` : item.label}</strong>
                    <p>{item.detail}</p>
                    <div className="contextual-command-panel__chips">
                      <span className={`command-context-pill${item.active ? " workflow-chip--active" : ""}`}>{item.coverageLabel}</span>
                      <span className="command-context-pill">{item.routeLabel}</span>
                    </div>
                  </div>
                  {item.action && onRunCompanionSequence ? (
                    <button
                      type="button"
                      className="action-button"
                      onClick={() => {
                        onRunCompanionSequence(item.id);
                      }}
                      title={item.action.description}
                    >
                      {item.active ? "Refresh sequence" : "Switch sequence"}
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}
          <div className="contextual-command-panel__next-step-list">
            {companionSequenceStepItems.map((item) => (
              <article key={item.id} className={`contextual-command-next-step contextual-command-next-step--${item.tone}`}>
                <div>
                  <span>{item.stepLabel}</span>
                  <strong>{item.active ? `${item.label} · Current step` : item.label}</strong>
                  <p>{item.detail}</p>
                  <div className="contextual-command-panel__chips">
                    <span className={`command-context-pill${item.active ? " workflow-chip--active" : ""}`}>{item.roleLabel}</span>
                    <span className="command-context-pill">{item.coverageLabel}</span>
                    <span className="command-context-pill">{item.pathLabel}</span>
                  </div>
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
                    {item.active ? "Refresh step" : "Focus step"}
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {companionReviewPathItems.length ? (
        <div className="contextual-command-panel__section">
          <div className="contextual-command-panel__section-header">
            <span>Companion Review-path Orchestration</span>
            <strong>{companionReviewPathsLabel ?? `${companionReviewPathItems.length} explicit paths`}</strong>
          </div>
          <p className="panel-summary panel-summary--tight">
            {companionReviewPathsSummary ??
              "The current review surface now exposes explicit source -> companion review paths with primary and follow-up pivots instead of leaving companion linkage implicit."}
          </p>
          <div className="contextual-command-panel__next-step-list">
            {companionReviewPathItems.map((item) => (
              <article key={item.id} className={`contextual-command-next-step contextual-command-next-step--${item.tone}`}>
                <div>
                  <span>{item.kindLabel}</span>
                  <strong>{item.active ? `${item.label} · Current path` : item.label}</strong>
                  <p>{item.detail}</p>
                  <div className="contextual-command-panel__chips">
                    <span className={`command-context-pill${item.active ? " workflow-chip--active" : ""}`}>{item.sourceLabel}</span>
                    <span className="command-context-pill">{item.coverageLabel}</span>
                    <span className="command-context-pill">{item.pathLabel}</span>
                    <span className="command-context-pill">{item.routeLabel}</span>
                    {item.sequenceLabel ? <span className="command-context-pill">{item.sequenceLabel}</span> : null}
                    {item.followUpActionLabels.map((label) => (
                      <span key={`${item.id}-${label}`} className="command-context-pill">
                        {label}
                      </span>
                    ))}
                  </div>
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
                    {item.primaryActionLabel}
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
