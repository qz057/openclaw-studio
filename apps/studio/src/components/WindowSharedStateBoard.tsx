import {
  selectStudioReleaseApprovalPipelineStage,
  selectStudioReleaseCloseoutWindow,
  selectStudioReleaseDeliveryChainStage,
  selectStudioReleaseEscalationWindow,
  selectStudioReleaseReviewerQueue,
  selectStudioReviewStateContinuityEntry,
  selectStudioWindowObservabilityMapping,
  type StudioCommandAction,
  type StudioCommandActionDeck,
  type StudioPageId,
  type StudioReleaseAcknowledgementState,
  type StudioReleaseApprovalPipeline,
  type StudioReleaseCloseoutWindowState,
  type StudioReleaseEscalationWindowState,
  type StudioReleaseReviewerQueueStatus,
  type StudioShellState
} from "@openclaw/shared";

interface WindowSharedStateBoardProps {
  windowing: StudioShellState["windowing"];
  reviewStateContinuity?: StudioShellState["reviewStateContinuity"];
  releaseApprovalPipeline?: StudioReleaseApprovalPipeline;
  actionDeck?: StudioCommandActionDeck | null;
  reviewSurfaceActions?: StudioCommandAction[];
  activeReviewSurfaceActionId?: string | null;
  activeCompanionSequenceId?: string | null;
  onRunReviewSurfaceAction?: (action: StudioCommandAction) => void;
  onRunCompanionSequence?: (sequenceId: string) => void;
  activeRouteId?: StudioPageId;
  activeWindowId?: string | null;
  activeLaneId?: string | null;
  activeBoardId?: string | null;
  activeMappingId?: string | null;
  compact?: boolean;
  nested?: boolean;
  eyebrow?: string;
  title?: string;
  summary?: string;
}

function resolveSyncTone(health: StudioShellState["windowing"]["sharedState"]["lanes"][number]["sync"]["health"]): "positive" | "neutral" | "warning" {
  switch (health) {
    case "synced":
      return "positive";
    case "drift-watch":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveLaneTone(status: StudioShellState["windowing"]["sharedState"]["lanes"][number]["status"]): "positive" | "neutral" | "warning" {
  switch (status) {
    case "active":
      return "positive";
    case "handoff-ready":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveAcknowledgementTone(state: StudioReleaseAcknowledgementState): "positive" | "neutral" | "warning" {
  switch (state) {
    case "acknowledged":
      return "positive";
    case "pending":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveReviewerQueueTone(status: StudioReleaseReviewerQueueStatus): "positive" | "neutral" | "warning" {
  switch (status) {
    case "closed":
      return "positive";
    case "active":
    case "handoff-ready":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveEscalationTone(state: StudioReleaseEscalationWindowState): "positive" | "neutral" | "warning" {
  switch (state) {
    case "watch":
      return "positive";
    case "open":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveCloseoutWindowTone(state: StudioReleaseCloseoutWindowState): "positive" | "neutral" | "warning" {
  switch (state) {
    case "ready-to-seal":
      return "positive";
    case "scheduled":
    case "open":
      return "neutral";
    default:
      return "warning";
  }
}

function formatOwnershipMode(mode: StudioShellState["windowing"]["sharedState"]["lanes"][number]["ownership"]["mode"]): string {
  switch (mode) {
    case "owned":
      return "Owned";
    case "shared-review":
      return "Shared Review";
    default:
      return "Handoff";
  }
}

function formatWindowKind(kind: StudioShellState["windowing"]["roster"]["windows"][number]["kind"]): string {
  switch (kind) {
    case "main-shell":
      return "Main Shell";
    case "workspace":
      return "Workspace";
    default:
      return "Detached Candidate";
  }
}

function formatReviewPostureRelationship(
  relationship: StudioShellState["windowing"]["observability"]["mappings"][number]["relationship"]
): string {
  switch (relationship) {
    case "owns-current-posture":
      return "Owns current posture";
    case "mirrors-current-posture":
      return "Mirrors current posture";
    case "staged-for-handoff":
      return "Staged for handoff";
    case "blocked-upstream":
      return "Blocked upstream";
    case "escalation-shadow":
      return "Escalation shadow";
    default:
      return "Blocked decision gate";
  }
}

function formatReviewSurfaceKind(kind: StudioCommandAction["reviewSurfaceKind"]): string {
  switch (kind) {
    case "review-packet":
      return "Review packet";
    case "reviewer-queue":
      return "Reviewer queue";
    case "decision-handoff":
      return "Decision handoff";
    case "evidence-closeout":
      return "Evidence closeout";
    case "decision-gate":
      return "Decision gate";
    case "closeout-window":
      return "Closeout window";
    default:
      return "Review surface";
  }
}

function formatCompanionReviewPathKind(
  kind: NonNullable<StudioCommandActionDeck["lanes"][number]["companionReviewPaths"]>[number]["kind"]
): string {
  switch (kind) {
    case "stage-companion":
      return "Stage companion";
    case "handoff-companion":
      return "Handoff companion";
    case "rollback-companion":
      return "Rollback companion";
    default:
      return "Stabilization companion";
  }
}

function formatCompanionRouteState(action: StudioCommandAction | null | undefined, windowing: StudioShellState["windowing"]): string {
  const linkedIntent = action?.windowIntentId ? windowing.windowIntents.find((entry) => entry.id === action.windowIntentId) ?? null : null;
  const routeId = linkedIntent?.shellLink.pageId ?? action?.routeId ?? "No route";
  const workspaceViewId = linkedIntent?.workspaceViewId ?? action?.workspaceViewId ?? "No workspace";
  const intentLabel = linkedIntent?.label ?? action?.windowIntentId ?? "No intent";

  return `${routeId} / ${workspaceViewId} / ${intentLabel}`;
}

function formatCompanionReviewSequenceStepRole(
  role: NonNullable<StudioCommandActionDeck["lanes"][number]["companionSequences"]>[number]["steps"][number]["role"]
): string {
  switch (role) {
    case "current-review-surface":
      return "Current surface";
    case "primary-companion":
      return "Primary companion";
    default:
      return "Follow-up companion";
  }
}

export function resolveActiveWindowSharedStateLane(
  windowing: StudioShellState["windowing"],
  activeLaneId?: string | null,
  activeBoardId?: string | null,
  activeRouteId?: StudioPageId
) {
  if (activeLaneId) {
    const lane = windowing.sharedState.lanes.find((entry) => entry.id === activeLaneId);
    if (lane) {
      return lane;
    }
  }

  if (activeBoardId) {
    const board = windowing.orchestration.boards.find((entry) => entry.id === activeBoardId);
    if (board) {
      const lane = windowing.sharedState.lanes.find((entry) => entry.workflowLaneId === board.laneId);
      if (lane) {
        return lane;
      }
    }
  }

  if (activeRouteId) {
    const lane = windowing.sharedState.lanes.find((entry) => entry.routeId === activeRouteId);
    if (lane) {
      return lane;
    }
  }

  return (
    windowing.sharedState.lanes.find((entry) => entry.id === windowing.sharedState.activeLaneId) ?? windowing.sharedState.lanes[0] ?? null
  );
}

export function resolveActiveWindowRosterEntry(
  windowing: StudioShellState["windowing"],
  activeWindowId?: string | null,
  activeLane?: StudioShellState["windowing"]["sharedState"]["lanes"][number] | null,
  activeRouteId?: StudioPageId
) {
  if (activeWindowId) {
    const entry = windowing.roster.windows.find((windowEntry) => windowEntry.id === activeWindowId);
    if (entry) {
      return entry;
    }
  }

  if (activeLane) {
    const entry = windowing.roster.windows.find((windowEntry) => windowEntry.id === activeLane.windowId);
    if (entry) {
      return entry;
    }
  }

  if (activeRouteId) {
    const entry = windowing.roster.windows.find((windowEntry) => windowEntry.routeId === activeRouteId);
    if (entry) {
      return entry;
    }
  }

  return windowing.roster.windows.find((entry) => entry.id === windowing.roster.activeWindowId) ?? windowing.roster.windows[0] ?? null;
}

function resolveActiveOrchestrationBoard(
  windowing: StudioShellState["windowing"],
  activeBoardId?: string | null,
  activeLane?: StudioShellState["windowing"]["sharedState"]["lanes"][number] | null,
  activeRouteId?: StudioPageId
) {
  if (activeBoardId) {
    const board = windowing.orchestration.boards.find((entry) => entry.id === activeBoardId);
    if (board) {
      return board;
    }
  }

  if (activeLane) {
    const board = windowing.orchestration.boards.find((entry) => entry.laneId === activeLane.workflowLaneId);
    if (board) {
      return board;
    }
  }

  if (activeRouteId) {
    const board = windowing.orchestration.boards.find((entry) => entry.routeId === activeRouteId);
    if (board) {
      return board;
    }
  }

  return windowing.orchestration.boards.find((entry) => entry.id === windowing.orchestration.activeBoardId) ?? windowing.orchestration.boards[0] ?? null;
}

export function WindowSharedStateBoard({
  windowing,
  reviewStateContinuity,
  releaseApprovalPipeline,
  actionDeck,
  reviewSurfaceActions = [],
  activeReviewSurfaceActionId,
  activeCompanionSequenceId,
  onRunReviewSurfaceAction,
  onRunCompanionSequence,
  activeRouteId,
  activeWindowId,
  activeLaneId,
  activeBoardId,
  activeMappingId,
  compact = false,
  nested = false,
  eyebrow = "Windows",
  title,
  summary
}: WindowSharedStateBoardProps) {
  const activeLane = resolveActiveWindowSharedStateLane(windowing, activeLaneId, activeBoardId, activeRouteId);
  const activeWindow = resolveActiveWindowRosterEntry(windowing, activeWindowId, activeLane, activeRouteId);
  const activeBoard = resolveActiveOrchestrationBoard(windowing, activeBoardId, activeLane, activeRouteId);
  const activeObservabilityMapping = selectStudioWindowObservabilityMapping(windowing, activeMappingId) ?? null;
  const observabilityMappings = windowing.observability.mappings;
  const currentReleaseStage = releaseApprovalPipeline ? selectStudioReleaseApprovalPipelineStage(releaseApprovalPipeline) : null;
  const currentDeliveryStage = releaseApprovalPipeline ? selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, currentReleaseStage ?? undefined) : null;
  const publishDeliveryStage =
    releaseApprovalPipeline ? selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, "delivery-chain-publish-decision") : null;
  const rollbackDeliveryStage =
    releaseApprovalPipeline ? selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, "delivery-chain-rollback-readiness") : null;
  const currentReviewerQueue = releaseApprovalPipeline ? selectStudioReleaseReviewerQueue(releaseApprovalPipeline, currentReleaseStage ?? undefined) : null;
  const currentEscalationWindow =
    releaseApprovalPipeline ? selectStudioReleaseEscalationWindow(releaseApprovalPipeline, currentReleaseStage ?? undefined) : null;
  const currentCloseoutWindow =
    releaseApprovalPipeline ? selectStudioReleaseCloseoutWindow(releaseApprovalPipeline, currentReleaseStage ?? undefined) : null;
  const activeQueueEntry =
    currentReviewerQueue?.entries.find((entry) => entry.id === currentReviewerQueue.activeEntryId) ?? currentReviewerQueue?.entries[0] ?? null;
  const deliveryCoverageEntries = releaseApprovalPipeline
    ? [currentDeliveryStage, publishDeliveryStage, rollbackDeliveryStage]
        .filter((stage, index, stages): stage is NonNullable<typeof stage> => Boolean(stage) && stages.findIndex((entry) => entry?.id === stage?.id) === index)
        .map((stage) => {
          const mappings = observabilityMappings.filter((mapping) => mapping.reviewPosture.deliveryChainStageId === stage.id);
          const primaryMapping = mappings.find((mapping) => mapping.id === activeObservabilityMapping?.id) ?? mappings[0] ?? null;
          const primaryWindow = primaryMapping
            ? windowing.roster.windows.find((entry) => entry.id === primaryMapping.windowId) ?? null
            : null;
          const primaryLane = primaryMapping
            ? windowing.sharedState.lanes.find((entry) => entry.id === primaryMapping.sharedStateLaneId) ?? null
            : null;
          const primaryBoard = primaryMapping
            ? windowing.orchestration.boards.find((entry) => entry.id === primaryMapping.orchestrationBoardId) ?? null
            : null;
          const pipelineStage = releaseApprovalPipeline.stages.find((entry) => entry.id === stage.pipelineStageId) ?? null;
          const reviewerQueue = pipelineStage ? selectStudioReleaseReviewerQueue(releaseApprovalPipeline, pipelineStage) ?? null : null;

          return {
            stage,
            primaryMapping,
            primaryWindow,
            primaryLane,
            primaryBoard,
            reviewerQueue,
            mappings
          };
        })
    : [];
  const relevantActionDeckLanes =
    actionDeck?.lanes.filter((lane) => {
      const coversWindow = activeWindow ? (lane.windowIds ?? []).includes(activeWindow.id) : false;
      const coversSharedStateLane = activeLane ? (lane.sharedStateLaneIds ?? []).includes(activeLane.id) : false;
      const coversBoard = activeBoard ? (lane.orchestrationBoardIds ?? []).includes(activeBoard.id) : false;
      const coversMapping = activeObservabilityMapping
        ? (lane.observabilityMappingIds ?? []).includes(activeObservabilityMapping.id)
        : false;

      return coversWindow || coversSharedStateLane || coversBoard || coversMapping;
    }) ?? [];
  const relevantReviewSurfaceActions = reviewSurfaceActions.filter((action) => {
    const coversWindow = activeWindow ? action.windowId === activeWindow.id : false;
    const coversSharedStateLane = activeLane ? action.sharedStateLaneId === activeLane.id : false;
    const coversBoard = activeBoard ? action.orchestrationBoardId === activeBoard.id : false;
    const coversMapping = activeObservabilityMapping ? action.observabilityMappingId === activeObservabilityMapping.id : false;

    return coversWindow || coversSharedStateLane || coversBoard || coversMapping;
  });
  const activeReviewSurfaceAction =
    relevantReviewSurfaceActions.find((action) => action.id === activeReviewSurfaceActionId) ?? relevantReviewSurfaceActions[0] ?? null;
  const activeReviewContinuity = reviewStateContinuity
    ? selectStudioReviewStateContinuityEntry(reviewStateContinuity, {
        reviewSurfaceActionId: activeReviewSurfaceAction?.id ?? activeReviewSurfaceActionId,
        observabilityMappingId: activeObservabilityMapping?.id ?? activeMappingId,
        sharedStateLaneId: activeLane?.id ?? activeLaneId,
        orchestrationBoardId: activeBoard?.id ?? activeBoardId,
        windowId: activeWindow?.id ?? activeWindowId
      }) ?? null
    : null;
  const relevantActionDeckActionIds = [...new Set(relevantActionDeckLanes.flatMap((lane) => lane.actionIds))];
  const relevantActionDeckStageIds = [...new Set(relevantActionDeckLanes.flatMap((lane) => lane.deliveryChainStageIds ?? []))];
  const relevantActionDeckSequenceIds = [...new Set(relevantActionDeckLanes.flatMap((lane) => (lane.companionSequences ?? []).map((sequence) => sequence.id)))];
  const reviewSurfaceActionById = new Map(reviewSurfaceActions.map((action) => [action.id, action]));
  const relevantCompanionSequences = relevantActionDeckLanes
    .flatMap((lane) => lane.companionSequences ?? [])
    .filter((sequence, index, sequences) => sequences.findIndex((entry) => entry.id === sequence.id) === index)
    .filter((sequence) => {
      const linkedActions = sequence.steps
        .map((step) => reviewSurfaceActionById.get(step.actionId))
        .filter((action): action is StudioCommandAction => Boolean(action));

      return linkedActions.some((action) => relevantReviewSurfaceActions.some((entry) => entry.id === action.id)) || sequence.steps.some((step) => step.actionId === activeReviewSurfaceAction?.id);
    })
    .sort(
      (left, right) =>
        Number(right.steps.some((step) => step.actionId === activeReviewSurfaceAction?.id)) -
        Number(left.steps.some((step) => step.actionId === activeReviewSurfaceAction?.id))
    );
  const activeCompanionSequence =
    (activeCompanionSequenceId ? relevantCompanionSequences.find((sequence) => sequence.id === activeCompanionSequenceId) : undefined) ??
    relevantCompanionSequences.find((sequence) => sequence.steps.some((step) => step.actionId === activeReviewSurfaceAction?.id)) ??
    relevantCompanionSequences[0] ??
    null;
  const relevantCompanionReviewPaths = relevantActionDeckLanes
    .flatMap((lane) => lane.companionReviewPaths ?? [])
    .filter((path, index, paths) => paths.findIndex((entry) => entry.id === path.id) === index)
    .filter((path) => {
      const linkedActions = [path.sourceActionId, path.primaryActionId, ...(path.followUpActionIds ?? [])]
        .map((actionId) => reviewSurfaceActionById.get(actionId))
        .filter((action): action is StudioCommandAction => Boolean(action));

      return linkedActions.some((action) => relevantReviewSurfaceActions.some((entry) => entry.id === action.id)) || path.sourceActionId === activeReviewSurfaceAction?.id;
    });
  const activeCompanionReviewPaths = relevantCompanionReviewPaths.filter((path) => path.sourceActionId === activeReviewSurfaceAction?.id);
  const resolvedCompanionReviewPaths = activeCompanionReviewPaths.length
    ? activeCompanionReviewPaths
    : activeCompanionSequence
      ? relevantCompanionReviewPaths.filter((path) => path.sequenceId === activeCompanionSequence.id)
      : relevantCompanionReviewPaths;
  const activeCompanionReviewPath =
    resolvedCompanionReviewPaths.find((path) => path.sourceActionId === activeReviewSurfaceAction?.id) ?? resolvedCompanionReviewPaths[0] ?? null;
  const activeCompanionSequenceCurrentStepIndex =
    activeCompanionSequence?.steps.findIndex((step) => step.actionId === activeReviewSurfaceAction?.id) ?? -1;
  const activeReviewSurfaceStage =
    activeReviewSurfaceAction?.deliveryChainStageId && releaseApprovalPipeline
      ? selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, activeReviewSurfaceAction.deliveryChainStageId)
      : currentDeliveryStage;
  const activeReviewSurfaceLabel =
    activeReviewContinuity?.readouts.find((line) => line.id === "review-surface")?.value ??
    (activeReviewSurfaceAction ? `${activeReviewSurfaceAction.label} / ${formatReviewSurfaceKind(activeReviewSurfaceAction.reviewSurfaceKind)}` : "No active review surface");
  const activeWindowStateContinuity =
    activeReviewContinuity?.readouts.find((line) => line.id === "continuity-spine")?.value ??
    `${activeWindow?.label ?? "No window"} -> ${activeLane?.label ?? "No lane"} -> ${activeBoard?.label ?? "No board"}`;
  const activeObservabilityCloseoutLabel = activeObservabilityMapping
    ? `${activeObservabilityMapping.label} / ${formatReviewPostureRelationship(activeObservabilityMapping.relationship)}`
    : "No observability closeout";
  const activeMappedWindowLabels = [
    ...new Set(
      observabilityMappings
        .filter((mapping) => mapping.reviewPosture.deliveryChainStageId === activeReviewSurfaceStage?.id)
        .map((mapping) => windowing.roster.windows.find((entry) => entry.id === mapping.windowId)?.label ?? mapping.windowId)
    )
  ];
  const activeReviewSurfaceLabels = [...new Set(relevantReviewSurfaceActions.map((action) => formatReviewSurfaceKind(action.reviewSurfaceKind)))];
  const reviewStateContinuitySummary = activeReviewContinuity?.summary ??
    (activeReviewSurfaceAction
      ? `${activeReviewSurfaceAction.label} stays anchored to ${activeWindowStateContinuity} while ${
        activeObservabilityMapping?.label ?? "the active observability row"
      } keeps reviewer queue, closeout timing, and companion coverage attached to the same local-only review state.`
      : "The current window, lane, board, and observability row do not yet expose a shared review surface.");
  const activeReviewerQueueLabel =
    activeReviewContinuity?.readouts.find((line) => line.id === "reviewer-queue")?.value ??
    (currentReviewerQueue ? `${currentReviewerQueue.label} / ${currentReviewerQueue.status}` : "No reviewer queue");
  const activeContinuityCloseoutLabel =
    activeReviewContinuity?.readouts.find((line) => line.id === "closeout-timing")?.value ??
    (currentCloseoutWindow ? `${currentCloseoutWindow.label} / ${currentCloseoutWindow.state}` : "No closeout window");
  const continuitySpineDetail =
    activeReviewContinuity?.readouts.find((line) => line.id === "continuity-spine")?.detail ??
    "Active window, shared-state lane, and orchestration board stay aligned so the same review posture can move between the delivery workspace, inspector, and windows rail without losing ownership context.";
  const closeoutTimingDetail =
    activeReviewContinuity?.readouts.find((line) => line.id === "closeout-timing")?.detail ??
    (activeQueueEntry
      ? `${activeQueueEntry.label} remains tied to ${currentCloseoutWindow?.label ?? "the current closeout window"}, so reviewer ownership and closeout timing stay readable from the same observability row.`
      : "Reviewer queue, escalation, and closeout timing remain attached to the current observability row.");
  const mappedReviewPathValue =
    activeReviewContinuity?.readouts.find((line) => line.id === "mapped-review-path")?.value ??
    (activeMappedWindowLabels.join(" / ") || "No mapped windows");
  const mappedReviewPathDetail =
    activeReviewContinuity?.readouts.find((line) => line.id === "mapped-review-path")?.detail ??
    (activeReviewSurfaceLabels.join(" / ") || "No linked review surfaces");
  const panelClassName = [
    nested ? "window-shared-board window-shared-board--nested" : "surface card window-shared-board",
    compact ? "window-shared-board--compact" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={panelClassName}>
      <div className="card-header card-header--stack">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title ?? windowing.sharedState.title}</h2>
          <p>{summary ?? windowing.sharedState.summary}</p>
        </div>
        <div className="windowing-card__meta">
          <span className="windowing-badge windowing-badge--active">{activeWindow?.label ?? "No active window"}</span>
          <span className="windowing-badge">{activeLane ? `${activeLane.label} / ${activeLane.status}` : "No shared-state lane"}</span>
          <span className="windowing-badge">{activeLane ? `Sync Health: ${activeLane.sync.health}` : "Sync Health unavailable"}</span>
        </div>
      </div>

      <div className="window-shared-detail-grid">
        <article className="windowing-summary-card windowing-summary-card--active window-shared-board__coherence-card">
          <span>Review State Continuity</span>
          <strong>{activeReviewSurfaceLabel}</strong>
          <p>{reviewStateContinuitySummary}</p>
          <div className="trace-note-links">
            <span className="windowing-badge windowing-badge--active">{activeReviewSurfaceStage?.label ?? "No delivery stage"}</span>
            <span className="windowing-badge">{activeObservabilityCloseoutLabel}</span>
            <span className="windowing-badge">{activeReviewerQueueLabel}</span>
            <span className="windowing-badge">{activeContinuityCloseoutLabel}</span>
          </div>
          <div className="windowing-preview-list">
            <div className="windowing-preview-line windowing-preview-line--stacked">
              <span>Context spine</span>
              <strong>{activeWindowStateContinuity}</strong>
              <p>{continuitySpineDetail}</p>
            </div>
            <div className="windowing-preview-line windowing-preview-line--stacked">
              <span>Observability closeout</span>
              <strong>{activeContinuityCloseoutLabel}</strong>
              <p>{closeoutTimingDetail}</p>
            </div>
            <div className="windowing-preview-line windowing-preview-line--stacked">
              <span>Mapped review path</span>
              <strong>{mappedReviewPathValue}</strong>
              <p>{mappedReviewPathDetail}</p>
            </div>
          </div>
          {onRunReviewSurfaceAction && activeReviewSurfaceAction ? (
            <div className="windowing-card__actions">
              <button type="button" className="secondary-button" onClick={() => onRunReviewSurfaceAction(activeReviewSurfaceAction)}>
                Focus active review surface
              </button>
              {onRunCompanionSequence && activeCompanionSequence ? (
                <button type="button" className="secondary-button" onClick={() => onRunCompanionSequence(activeCompanionSequence.id)}>
                  Refresh companion sequence
                </button>
              ) : null}
            </div>
          ) : null}
        </article>

        <article className="windowing-summary-card windowing-summary-card--active">
          <span>Review Posture Ownership</span>
          <strong>
            {activeObservabilityMapping
              ? `${activeObservabilityMapping.label} / ${formatReviewPostureRelationship(activeObservabilityMapping.relationship)}`
              : "No active review posture"}
          </strong>
          <p>
            {activeObservabilityMapping?.summary ??
              "Cross-window review posture ownership is unavailable, so the shell cannot show which route, window, lane, and board currently own the active review posture."}
          </p>
          <div className="windowing-preview-list">
            {(compact ? windowing.observability.signals.slice(0, 4) : windowing.observability.signals).map((signal) => (
              <div key={signal.id} className="windowing-preview-line windowing-preview-line--stacked">
                <span>{signal.label}</span>
                <strong>{signal.value}</strong>
                <p>{signal.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="windowing-summary-card windowing-summary-card--active">
          <span>Cross-window Coordination Board</span>
          <strong>{activeBoard?.label ?? activeLane?.label ?? activeWindow?.label ?? "No active coordination board"}</strong>
          <p>{activeBoard?.summary ?? activeLane?.summary ?? activeWindow?.summary ?? "No active cross-window coordination is available."}</p>
          <div className="windowing-preview-list">
            <div className="windowing-preview-line">
              <span>Window focus</span>
              <strong>{activeWindow?.label ?? "Unavailable"}</strong>
            </div>
            <div className="windowing-preview-line">
              <span>Shared-state lane</span>
              <strong>{activeLane ? `${activeLane.label} / ${activeLane.status}` : "Unavailable"}</strong>
            </div>
            <div className="windowing-preview-line">
              <span>Sync Health</span>
              <strong>{activeLane ? `${activeLane.sync.health} / ${activeLane.sync.updatedAt}` : "Unavailable"}</strong>
            </div>
            <div className="windowing-preview-line">
              <span>Last handoff</span>
              <strong>{activeLane?.lastHandoff.label ?? "Unavailable"}</strong>
            </div>
          </div>
        </article>

        {actionDeck ? (
          <article className="windowing-summary-card">
            <span>Command-surface Action Deck</span>
            <strong>{actionDeck.label}</strong>
            <p>
              {relevantActionDeckLanes.length > 0
                ? "The active window, shared-state lane, orchestration board, and observability row are all covered by the same review-deck action deck."
                : actionDeck.summary}
            </p>
            <div className="workflow-readiness-list">
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Covered lanes</span>
                <strong>{relevantActionDeckLanes.length} deck lanes</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Actions</span>
                <strong>{relevantActionDeckActionIds.length} linked actions</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Delivery stages</span>
                <strong>{relevantActionDeckStageIds.length} mapped stages</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Companion sequences</span>
                <strong>{relevantActionDeckSequenceIds.length} ordered sequences</strong>
              </div>
            </div>
            {relevantActionDeckLanes.length > 0 ? (
              <div className="windowing-preview-list">
                {relevantActionDeckLanes.map((lane) => {
                  const coveredStages = (lane.deliveryChainStageIds ?? [])
                    .map(
                      (stageId) =>
                        releaseApprovalPipeline?.deliveryChain.stages.find((entry) => entry.id === stageId)?.label ?? stageId
                    )
                    .join(" / ");
                  const coveredMappings = (lane.observabilityMappingIds ?? [])
                    .map((mappingId) => observabilityMappings.find((entry) => entry.id === mappingId)?.label ?? mappingId)
                    .join(" / ");

                  return (
                    <div key={lane.id} className="windowing-preview-line windowing-preview-line--stacked">
                      <span>{lane.label}</span>
                      <strong>{lane.actionIds.length} actions / {(lane.windowIds ?? []).length} windows</strong>
                      <p>{lane.summary}</p>
                      <div className="trace-note-links">
                        <span className={`windowing-badge${lane.tone === "positive" ? " windowing-badge--active" : ""}`}>
                          {coveredStages || "No mapped stages"}
                        </span>
                        <span className="windowing-badge">{coveredMappings || "No observability rows"}</span>
                        <span className="windowing-badge">{(lane.companionSequences ?? []).length} companion sequences</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </article>
        ) : null}

        {relevantReviewSurfaceActions.length > 0 ? (
          <article className="windowing-summary-card">
            <span>Coverage-driven Review Surfaces</span>
            <strong>{activeReviewSurfaceAction?.label ?? "No review surface"}</strong>
            <p>
              The active window, shared-state lane, orchestration board, and observability row now expose the same review-surface pivots used by the
              command deck.
            </p>
            <div className="workflow-readiness-list">
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Surface pivots</span>
                <strong>{relevantReviewSurfaceActions.length} linked actions</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Active kind</span>
                <strong>{formatReviewSurfaceKind(activeReviewSurfaceAction?.reviewSurfaceKind)}</strong>
              </div>
            </div>
            <div className="windowing-preview-list">
              {(compact ? relevantReviewSurfaceActions.slice(0, 3) : relevantReviewSurfaceActions).map((action) => (
                <div key={action.id} className="windowing-preview-line windowing-preview-line--stacked">
                  <span>{formatReviewSurfaceKind(action.reviewSurfaceKind)}</span>
                  <strong>{action.label}</strong>
                  <p>{action.description}</p>
                  {onRunReviewSurfaceAction ? (
                    <div className="windowing-card__actions">
                      <button type="button" className="secondary-button" onClick={() => onRunReviewSurfaceAction(action)}>
                        {action.id === activeReviewSurfaceActionId ? "Refresh surface" : "Focus surface"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </article>
        ) : null}

        {activeCompanionSequence ? (
          <article className="windowing-summary-card">
            <span>Companion Sequence Navigator</span>
            <strong>{activeCompanionSequence.label}</strong>
            <p>
              The active window, shared-state lane, orchestration board, and observability row now resolve through an ordered companion sequence instead of
              only a flat path list.
            </p>
            <div className="workflow-readiness-list">
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Ordered steps</span>
                <strong>{activeCompanionSequence.steps.length} sequence steps</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Current step</span>
                <strong>
                  {activeCompanionSequenceCurrentStepIndex >= 0
                    ? `Step ${activeCompanionSequenceCurrentStepIndex + 1} of ${activeCompanionSequence.steps.length}`
                    : "No active sequence step"}
                </strong>
              </div>
            </div>
            {relevantCompanionSequences.length > 1 ? (
              <div className="windowing-preview-list">
                {relevantCompanionSequences.map((sequence) => {
                  const sourceAction = reviewSurfaceActionById.get(sequence.steps[0]?.actionId ?? "") ?? null;
                  const sourceStage = sourceAction?.deliveryChainStageId
                    ? releaseApprovalPipeline
                      ? selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, sourceAction.deliveryChainStageId)
                      : null
                    : null;
                  const sourceWindow = sourceAction?.windowId
                    ? windowing.roster.windows.find((entry) => entry.id === sourceAction.windowId) ?? null
                    : null;
                  const active = sequence.id === activeCompanionSequence.id;

                  return (
                    <div key={sequence.id} className="windowing-preview-line windowing-preview-line--stacked">
                      <span>Companion Sequence Switcher</span>
                      <strong>{active ? `${sequence.label} / active sequence` : sequence.label}</strong>
                      <p>{sequence.summary}</p>
                      <div className="trace-note-links">
                        <span className={`windowing-badge${active ? " windowing-badge--active" : ""}`}>{sequence.steps.length} steps</span>
                        <span className="windowing-badge">
                          {sourceStage?.label ?? sourceAction?.deliveryChainStageId ?? "No stage"} / {sourceWindow?.label ?? sourceAction?.windowId ?? "No window"}
                        </span>
                        <span className="windowing-badge">{formatCompanionRouteState(sourceAction, windowing)}</span>
                      </div>
                      {onRunCompanionSequence && sourceAction ? (
                        <div className="windowing-card__actions">
                          <button type="button" className="secondary-button" onClick={() => onRunCompanionSequence(sequence.id)}>
                            {active ? "Refresh sequence" : "Switch sequence"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
            <div className="windowing-preview-list">
              {(compact ? activeCompanionSequence.steps.slice(0, 3) : activeCompanionSequence.steps).map((step, index) => {
                const stepAction = reviewSurfaceActionById.get(step.actionId) ?? null;
                const stepStage = stepAction?.deliveryChainStageId
                  ? releaseApprovalPipeline
                    ? selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, stepAction.deliveryChainStageId)
                    : null
                  : null;
                const stepWindow = stepAction?.windowId
                  ? windowing.roster.windows.find((entry) => entry.id === stepAction.windowId) ?? null
                  : null;
                const stepLane = stepAction?.sharedStateLaneId
                  ? windowing.sharedState.lanes.find((entry) => entry.id === stepAction.sharedStateLaneId) ?? null
                  : null;
                const stepBoard = stepAction?.orchestrationBoardId
                  ? windowing.orchestration.boards.find((entry) => entry.id === stepAction.orchestrationBoardId) ?? null
                  : null;
                const stepMapping = stepAction?.observabilityMappingId
                  ? windowing.observability.mappings.find((entry) => entry.id === stepAction.observabilityMappingId) ?? null
                  : null;
                const active = step.actionId === activeReviewSurfaceAction?.id;

                return (
                  <div key={step.id} className="windowing-preview-line windowing-preview-line--stacked">
                    <span>
                      Step {index + 1} of {activeCompanionSequence.steps.length}
                    </span>
                    <strong>{active ? `${stepAction?.label ?? step.actionId} / current step` : stepAction?.label ?? step.actionId}</strong>
                    <p>{step.summary}</p>
                    <div className="trace-note-links">
                      <span className={`windowing-badge${active ? " windowing-badge--active" : ""}`}>
                        {formatCompanionReviewSequenceStepRole(step.role)}
                      </span>
                      <span className="windowing-badge">
                        {stepStage?.label ?? stepAction?.deliveryChainStageId ?? "No stage"} / {stepWindow?.label ?? stepAction?.windowId ?? "No window"}
                      </span>
                      <span className="windowing-badge">
                        {stepLane?.label ?? stepAction?.sharedStateLaneId ?? "No lane"} / {stepBoard?.label ?? stepAction?.orchestrationBoardId ?? "No board"}
                      </span>
                      <span className="windowing-badge">{stepMapping?.label ?? stepAction?.observabilityMappingId ?? "No observability path"}</span>
                      <span className="windowing-badge">{formatCompanionRouteState(stepAction, windowing)}</span>
                    </div>
                    {onRunReviewSurfaceAction && stepAction ? (
                      <div className="windowing-card__actions">
                        <button type="button" className="secondary-button" onClick={() => onRunReviewSurfaceAction(stepAction)}>
                          {active ? "Refresh step" : "Focus step"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </article>
        ) : null}

        {resolvedCompanionReviewPaths.length > 0 ? (
          <article className="windowing-summary-card">
            <span>Companion Review Paths</span>
            <strong>{activeCompanionReviewPath?.label ?? "No companion review path"}</strong>
            <p>
              The active window, shared-state lane, orchestration board, and observability row now keep explicit companion review paths under the active
              sequence, so source-to-primary/follow-up pivots remain inspectable alongside mapped coverage.
            </p>
            <div className="workflow-readiness-list">
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Explicit paths</span>
                <strong>{resolvedCompanionReviewPaths.length} linked paths</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Current source</span>
                <strong>{activeReviewSurfaceAction?.label ?? "No active source surface"}</strong>
              </div>
            </div>
            <div className="windowing-preview-list">
              {(compact ? resolvedCompanionReviewPaths.slice(0, 2) : resolvedCompanionReviewPaths).map((path) => {
                const sourceAction = reviewSurfaceActionById.get(path.sourceActionId) ?? null;
                const primaryAction = reviewSurfaceActionById.get(path.primaryActionId) ?? null;
                const companionSequence = relevantCompanionSequences.find((sequence) => sequence.id === path.sequenceId) ?? null;
                const followUpActions = (path.followUpActionIds ?? [])
                  .map((actionId) => reviewSurfaceActionById.get(actionId))
                  .filter((action): action is StudioCommandAction => Boolean(action));
                const primaryStage = primaryAction?.deliveryChainStageId
                  ? releaseApprovalPipeline
                    ? selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, primaryAction.deliveryChainStageId)
                    : null
                  : null;
                const primaryWindow = primaryAction?.windowId
                  ? windowing.roster.windows.find((entry) => entry.id === primaryAction.windowId) ?? null
                  : null;
                const primaryLane = primaryAction?.sharedStateLaneId
                  ? windowing.sharedState.lanes.find((entry) => entry.id === primaryAction.sharedStateLaneId) ?? null
                  : null;
                const primaryBoard = primaryAction?.orchestrationBoardId
                  ? windowing.orchestration.boards.find((entry) => entry.id === primaryAction.orchestrationBoardId) ?? null
                  : null;
                const active =
                  path.sourceActionId === activeReviewSurfaceAction?.id ||
                  path.primaryActionId === activeReviewSurfaceAction?.id ||
                  Boolean(activeReviewSurfaceAction?.id && path.followUpActionIds?.includes(activeReviewSurfaceAction.id));

                return (
                  <div key={path.id} className="windowing-preview-line windowing-preview-line--stacked">
                    <span>{formatCompanionReviewPathKind(path.kind)}</span>
                    <strong>{active ? `${path.label} / current source` : path.label}</strong>
                    <p>{path.summary}</p>
                    <div className="trace-note-links">
                      <span className={`windowing-badge${active ? " windowing-badge--active" : ""}`}>{sourceAction?.label ?? path.sourceActionId}</span>
                      <span className="windowing-badge">{primaryAction?.label ?? path.primaryActionId}</span>
                      {companionSequence ? <span className="windowing-badge">{companionSequence.label}</span> : null}
                      <span className="windowing-badge">
                        {primaryStage?.label ?? primaryAction?.deliveryChainStageId ?? "No stage"} / {primaryWindow?.label ?? primaryAction?.windowId ?? "No window"}
                      </span>
                      <span className="windowing-badge">
                        {primaryLane?.label ?? primaryAction?.sharedStateLaneId ?? "No lane"} / {primaryBoard?.label ?? primaryAction?.orchestrationBoardId ?? "No board"}
                      </span>
                      <span className="windowing-badge">
                        {formatCompanionRouteState(sourceAction, windowing)}
                        {" -> "}
                        {formatCompanionRouteState(primaryAction, windowing)}
                      </span>
                      {followUpActions.map((action) => (
                        <span key={`${path.id}-${action.id}`} className="windowing-badge">
                          {action.label}
                        </span>
                      ))}
                    </div>
                    {onRunReviewSurfaceAction && primaryAction ? (
                      <div className="windowing-card__actions">
                        <button type="button" className="secondary-button" onClick={() => onRunReviewSurfaceAction(primaryAction)}>
                          {primaryAction.label}
                        </button>
                        {followUpActions.map((action) => (
                          <button key={action.id} type="button" className="secondary-button" onClick={() => onRunReviewSurfaceAction(action)}>
                            {action.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </article>
        ) : null}

        <article className="windowing-summary-card">
          <span>Route / workspace intent links</span>
          <strong>{activeLane?.routeLinks[0]?.summary ?? activeWindow?.routeLinks[0]?.summary ?? "No route linkage is available."}</strong>
          <p>
            Route, workspace, detached panel, intent, and focused-slot linkage are now explicit so cross-window review posture can be audited without
            creating another runtime.
          </p>
          <div className="windowing-preview-list">
            {(activeLane?.routeLinks ?? activeWindow?.routeLinks ?? []).map((link) => (
              <div key={link.id} className="windowing-preview-line windowing-preview-line--stacked">
                <span>
                  {link.routeId}
                  {" -> "}
                  {link.workspaceViewId}
                </span>
                <strong>{link.windowIntentId ?? link.detachedPanelId ?? "shell-linked"}</strong>
                <p>{link.summary}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="windowing-summary-card">
          <span>Local-only blockers</span>
          <strong>{activeLane?.blockers.length ?? activeWindow?.blockers.length ?? 0} active</strong>
          <p>Ownership, sync, and handoff are explicit, but detached native window control and host-side execution remain blocked in this phase.</p>
          <div className="windowing-preview-list">
            {(activeLane?.blockers ?? activeWindow?.blockers ?? []).map((blocker) => (
              <div key={blocker.id} className="windowing-preview-line windowing-preview-line--stacked">
                <span>{blocker.label}</span>
                <strong>{blocker.tone}</strong>
                <p>{blocker.detail}</p>
              </div>
            ))}
          </div>
        </article>

        {releaseApprovalPipeline ? (
          <article className="windowing-summary-card">
            <span>Operator review lane</span>
            <strong>{currentReleaseStage?.label ?? releaseApprovalPipeline.reviewBoard.title}</strong>
            <p>{releaseApprovalPipeline.reviewBoard.summary}</p>
            <div className="workflow-readiness-list">
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Stage ownership</span>
                <strong>{currentReleaseStage ? `${currentReleaseStage.owner} / ${currentReleaseStage.status}` : "Unavailable"}</strong>
              </div>
              <div className={`workflow-readiness-line workflow-readiness-line--${resolveAcknowledgementTone(releaseApprovalPipeline.reviewBoard.activeAcknowledgementState)}`}>
                <span>Acknowledgement</span>
                <strong>{releaseApprovalPipeline.reviewBoard.activeAcknowledgementState}</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Decision handoff</span>
                <strong>{releaseApprovalPipeline.decisionHandoff.posture}</strong>
              </div>
            </div>
          </article>
        ) : null}

        {releaseApprovalPipeline ? (
          <article className="windowing-summary-card">
            <span>Delivery chain posture</span>
            <strong>{currentDeliveryStage?.label ?? "No delivery stage"}</strong>
            <p>
              {currentDeliveryStage?.summary ??
                "The wider delivery-chain workspace is unavailable, so this board cannot show how promotion, publish, and rollback stay attached to the active review posture."}
            </p>
            <div className="workflow-readiness-list">
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Phase / status</span>
                <strong>{currentDeliveryStage ? `${currentDeliveryStage.phase} / ${currentDeliveryStage.status}` : "Unavailable"}</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--warning">
                <span>Publish flow</span>
                <strong>{publishDeliveryStage ? `${publishDeliveryStage.label} / ${publishDeliveryStage.status}` : "Unavailable"}</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--warning">
                <span>Rollback flow</span>
                <strong>{rollbackDeliveryStage ? `${rollbackDeliveryStage.label} / ${rollbackDeliveryStage.status}` : "Unavailable"}</strong>
              </div>
            </div>
          </article>
        ) : null}

        {releaseApprovalPipeline ? (
          <article className="windowing-summary-card">
            <span>Stage B / Stage C Bridge</span>
            <strong>
              {publishDeliveryStage && rollbackDeliveryStage
                ? `${publishDeliveryStage.label} -> ${rollbackDeliveryStage.label}`
                : "No bridge posture"}
            </strong>
            <p>
              Materialization continuity, installer/signing QA closeout, and the first safe approval / audit / rollback Stage C entry now stay visible
              through the same cross-window ownership map instead of becoming disconnected release-tail metadata.
            </p>
            <div className="workflow-readiness-list">
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Materialization</span>
                <strong>Packaged-app continuity / local-only</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--warning">
                <span>QA closeout</span>
                <strong>RELEASE-QA-CLOSEOUT-READINESS / review-only</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--warning">
                <span>Stage C entry</span>
                <strong>APPROVAL-AUDIT-ROLLBACK-ENTRY-CONTRACT / non-executing</strong>
              </div>
            </div>
          </article>
        ) : null}

        {releaseApprovalPipeline ? (
          <article className="windowing-summary-card">
            <span>Reviewer queue</span>
            <strong>{currentReviewerQueue?.label ?? "No reviewer queue"}</strong>
            <p>{currentReviewerQueue?.summary ?? "No reviewer queue is currently active."}</p>
            <div className="workflow-readiness-list">
              <div className={`workflow-readiness-line workflow-readiness-line--${resolveReviewerQueueTone(currentReviewerQueue?.status ?? "escalated")}`}>
                <span>Queue posture</span>
                <strong>{currentReviewerQueue ? `${currentReviewerQueue.status} / ${currentReviewerQueue.owner}` : "Unavailable"}</strong>
              </div>
              <div className={`workflow-readiness-line workflow-readiness-line--${resolveAcknowledgementTone(currentReviewerQueue?.acknowledgementState ?? "blocked")}`}>
                <span>Acknowledgement</span>
                <strong>{currentReviewerQueue?.acknowledgementState ?? "Unavailable"}</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Active entry</span>
                <strong>{activeQueueEntry ? `${activeQueueEntry.owner} / ${activeQueueEntry.status}` : "Unavailable"}</strong>
              </div>
            </div>
          </article>
        ) : null}

        {releaseApprovalPipeline ? (
          <article className="windowing-summary-card">
            <span>Escalation window</span>
            <strong>{currentEscalationWindow?.label ?? "No escalation window"}</strong>
            <p>{currentEscalationWindow?.summary ?? "No escalation window is currently active."}</p>
            <div className="workflow-readiness-list">
              <div className={`workflow-readiness-line workflow-readiness-line--${resolveEscalationTone(currentEscalationWindow?.state ?? "blocked")}`}>
                <span>Window state</span>
                <strong>{currentEscalationWindow?.state ?? "Unavailable"}</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Deadline</span>
                <strong>{currentEscalationWindow?.deadlineLabel ?? "Unavailable"}</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Trigger</span>
                <strong>{currentEscalationWindow?.trigger ?? "Unavailable"}</strong>
              </div>
            </div>
          </article>
        ) : null}

        {releaseApprovalPipeline ? (
          <article className="windowing-summary-card">
            <span>Closeout window</span>
            <strong>{currentCloseoutWindow?.label ?? "No closeout window"}</strong>
            <p>{currentCloseoutWindow?.summary ?? "No closeout window is currently active."}</p>
            <div className="workflow-readiness-list">
              <div className={`workflow-readiness-line workflow-readiness-line--${resolveCloseoutWindowTone(currentCloseoutWindow?.state ?? "blocked")}`}>
                <span>Window state</span>
                <strong>{currentCloseoutWindow?.state ?? "Unavailable"}</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Deadline</span>
                <strong>{currentCloseoutWindow?.deadlineLabel ?? "Unavailable"}</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Sealed / pending</span>
                <strong>
                  {currentCloseoutWindow ? `${currentCloseoutWindow.sealedEvidence.length} / ${currentCloseoutWindow.pendingEvidence.length}` : "Unavailable"}
                </strong>
              </div>
            </div>
          </article>
        ) : null}
      </div>

      {deliveryCoverageEntries.length > 0 ? (
        <>
          <div className="panel-title-row">
            <h3>Delivery Coverage Matrix</h3>
            <span>{deliveryCoverageEntries.length} staged surfaces</span>
          </div>

          <div className="window-roster-grid">
            {deliveryCoverageEntries.map(({ stage, primaryMapping, primaryWindow, primaryLane, primaryBoard, reviewerQueue, mappings }) => {
              const active = stage.id === currentDeliveryStage?.id;

              return (
                <article
                  key={`${stage.id}-coverage`}
                  className={active ? "windowing-summary-card windowing-summary-card--active" : "windowing-summary-card"}
                >
                  <span>{stage.phase}</span>
                  <strong>{stage.label}</strong>
                  <p>
                    Delivery Coverage Matrix keeps the selected delivery stage tied to a concrete window, shared-state lane, orchestration board, and
                    acknowledgement posture instead of leaving publish / rollback coverage buried in separate cards.
                  </p>
                  <div className="windowing-card__meta">
                    <span className={`windowing-badge${active ? " windowing-badge--active" : ""}`}>{stage.status}</span>
                    <span className="windowing-badge">{mappings.length} mapped paths</span>
                    <span className="windowing-badge">{reviewerQueue?.acknowledgementState ?? "no queue"}</span>
                  </div>
                  <div className="workflow-readiness-list">
                    <div className="workflow-readiness-line workflow-readiness-line--neutral">
                      <span>Primary window</span>
                      <strong>{primaryWindow?.label ?? "No mapped window"}</strong>
                    </div>
                    <div className="workflow-readiness-line workflow-readiness-line--neutral">
                      <span>Lane / board</span>
                      <strong>{primaryLane ? `${primaryLane.label} / ${primaryBoard?.label ?? primaryMapping?.orchestrationBoardId ?? "No board"}` : "No mapped lane"}</strong>
                    </div>
                    <div className={`workflow-readiness-line workflow-readiness-line--${resolveAcknowledgementTone(primaryMapping?.reviewPosture.acknowledgementState ?? reviewerQueue?.acknowledgementState ?? "blocked")}`}>
                      <span>Queue / acknowledgement</span>
                      <strong>
                        {primaryMapping
                          ? `${primaryMapping.reviewPosture.reviewerQueueId} / ${primaryMapping.reviewPosture.acknowledgementState}`
                          : reviewerQueue
                            ? `${reviewerQueue.label} / ${reviewerQueue.acknowledgementState}`
                            : "Unavailable"}
                      </strong>
                    </div>
                    <div className="workflow-readiness-line workflow-readiness-line--neutral">
                      <span>Route / slot</span>
                      <strong>{primaryMapping ? `${primaryMapping.routeId} / ${primaryMapping.focusedSlotId}` : "Unavailable"}</strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : null}

      <div className="panel-title-row">
        <h3>{windowing.observability.title}</h3>
        <span>{observabilityMappings.length} posture paths</span>
      </div>

      <div className="window-roster-grid">
        {observabilityMappings.map((mapping) => {
          const mappingWindow = windowing.roster.windows.find((entry) => entry.id === mapping.windowId);
          const mappingLane = windowing.sharedState.lanes.find((lane) => lane.id === mapping.sharedStateLaneId);
          const mappingBoard = windowing.orchestration.boards.find((board) => board.id === mapping.orchestrationBoardId);
          const mappingIntent = mapping.windowIntentId
            ? windowing.windowIntents.find((intent) => intent.id === mapping.windowIntentId) ?? null
            : null;
          const active = mapping.id === activeObservabilityMapping?.id;

          return (
            <article
              key={mapping.id}
              className={active ? "windowing-summary-card windowing-summary-card--active" : "windowing-summary-card"}
            >
              <span>{formatReviewPostureRelationship(mapping.relationship)}</span>
              <strong>{mapping.label}</strong>
              <p>{mapping.summary}</p>
              <div className="windowing-card__meta">
                <span className={`windowing-badge${active ? " windowing-badge--active" : ""}`}>{mapping.reviewPosture.stageLabel}</span>
                <span className="windowing-badge">{mappingWindow?.label ?? mapping.windowId}</span>
                <span className="windowing-badge">{mappingLane?.label ?? mapping.sharedStateLaneId}</span>
              </div>
              <div className="workflow-readiness-list">
              <div className={`workflow-readiness-line workflow-readiness-line--${resolveAcknowledgementTone(mapping.reviewPosture.acknowledgementState)}`}>
                <span>Queue / acknowledgement</span>
                <strong>
                  {mapping.reviewPosture.reviewerQueueId} / {mapping.reviewPosture.acknowledgementState}
                </strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Delivery phase</span>
                <strong>
                  {mapping.reviewPosture.deliveryPhase} / {mapping.reviewPosture.deliveryChainStageId}
                </strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Route / board</span>
                <strong>
                    {mapping.routeId} / {mappingBoard?.label ?? mapping.orchestrationBoardId}
                  </strong>
                </div>
                <div className="workflow-readiness-line workflow-readiness-line--neutral">
                  <span>Focused slot</span>
                  <strong>{mapping.focusedSlotId}</strong>
                </div>
              </div>
              {!compact ? (
                <div className="windowing-preview-list">
                  <div className="windowing-preview-line">
                    <span>Owner</span>
                    <strong>{mapping.owner}</strong>
                  </div>
                  <div className="windowing-preview-line">
                    <span>Escalation / closeout</span>
                    <strong>
                      {mapping.reviewPosture.escalationWindowId} / {mapping.reviewPosture.closeoutWindowId}
                    </strong>
                  </div>
                  <div className="windowing-preview-line">
                    <span>Decision / evidence</span>
                    <strong>
                      {mapping.reviewPosture.decisionHandoffId} / {mapping.reviewPosture.evidenceCloseoutId}
                    </strong>
                  </div>
                  <div className="windowing-preview-line">
                    <span>Intent</span>
                    <strong>{mappingIntent?.label ?? mapping.windowIntentId ?? "shell-linked"}</strong>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="panel-title-row">
        <h3>{windowing.roster.title}</h3>
        <span>{windowing.roster.windows.length} windows</span>
      </div>

      <div className="window-roster-grid">
        {windowing.roster.windows.map((entry) => {
          const active = entry.id === activeWindow?.id;

          return (
            <article
              key={entry.id}
              className={active ? "windowing-summary-card windowing-summary-card--active" : "windowing-summary-card"}
            >
              <span>{formatWindowKind(entry.kind)}</span>
              <strong>{entry.label}</strong>
              <p>{entry.summary}</p>
              <div className="windowing-card__meta">
                <span className={`windowing-badge${active ? " windowing-badge--active" : ""}`}>{entry.routeId}</span>
                <span className="windowing-badge">{entry.workspaceViewId}</span>
                <span className="windowing-badge">{formatOwnershipMode(entry.ownership.mode)}</span>
                <span className="windowing-badge">{entry.sync.health}</span>
              </div>
              {!compact ? (
                <div className="windowing-preview-list">
                  <div className="windowing-preview-line">
                    <span>Ownership</span>
                    <strong>{entry.ownership.owner}</strong>
                  </div>
                  <div className="windowing-preview-line">
                    <span>Review posture</span>
                    <strong>
                      {entry.reviewPosture.stageLabel} / {entry.reviewPosture.acknowledgementState}
                    </strong>
                  </div>
                  <div className="windowing-preview-line">
                    <span>Sync Health</span>
                    <strong>{entry.sync.updatedAt}</strong>
                  </div>
                  <div className="windowing-preview-line">
                    <span>Last handoff</span>
                    <strong>{entry.lastHandoff.label}</strong>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="panel-title-row">
        <h3>{windowing.sharedState.title}</h3>
        <span>{windowing.sharedState.lanes.length} lanes</span>
      </div>

      <div className="window-shared-lane-grid">
        {windowing.sharedState.lanes.map((lane) => {
          const active = lane.id === activeLane?.id;
          const syncTone = resolveSyncTone(lane.sync.health);
          const laneTone = resolveLaneTone(lane.status);

          return (
            <article key={lane.id} className={active ? "windowing-summary-card windowing-summary-card--active" : "windowing-summary-card"}>
              <span>{lane.label}</span>
              <strong>{lane.status}</strong>
              <p>{lane.summary}</p>
              <div className="windowing-card__meta">
                <span className={`windowing-badge${active ? " windowing-badge--active" : ""}`}>{lane.workspaceViewId}</span>
                <span className="windowing-badge">{lane.windowIntentId}</span>
                <span className="windowing-badge">{lane.focusedSlotId}</span>
                <span className="windowing-badge">{lane.posture}</span>
              </div>
              <div className="workflow-readiness-list">
                <div className={`workflow-readiness-line workflow-readiness-line--${laneTone}`}>
                  <span>Ownership</span>
                  <strong>
                    {lane.ownership.owner} / {formatOwnershipMode(lane.ownership.mode)}
                  </strong>
                </div>
                <div className={`workflow-readiness-line workflow-readiness-line--${resolveAcknowledgementTone(lane.reviewPosture.acknowledgementState)}`}>
                  <span>Review posture</span>
                  <strong>
                    {lane.reviewPosture.stageLabel} / {lane.reviewPosture.acknowledgementState}
                  </strong>
                </div>
                <div className={`workflow-readiness-line workflow-readiness-line--${syncTone}`}>
                  <span>Sync Health</span>
                  <strong>
                    {lane.sync.health} / {lane.sync.updatedAt}
                  </strong>
                </div>
                <div className="workflow-readiness-line workflow-readiness-line--neutral">
                  <span>Last handoff</span>
                  <strong>{lane.lastHandoff.label}</strong>
                </div>
              </div>
              {!compact ? (
                <div className="windowing-preview-list">
                  {lane.stateFields.map((field) => (
                    <div key={field.id} className="windowing-preview-line windowing-preview-line--stacked">
                      <span>{field.label}</span>
                      <strong>{field.value}</strong>
                      <p>{field.detail}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </article>
  );
}
