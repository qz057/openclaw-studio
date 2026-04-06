import {
  selectStudioReleaseApprovalPipelineStage,
  selectStudioReleaseCloseoutWindow,
  selectStudioReleaseDeliveryChainStage,
  selectStudioReleaseEscalationWindow,
  selectStudioReleaseReviewerQueue,
  selectStudioWindowObservabilityActiveMapping,
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
  releaseApprovalPipeline?: StudioReleaseApprovalPipeline;
  activeRouteId?: StudioPageId;
  activeWindowId?: string | null;
  activeLaneId?: string | null;
  activeBoardId?: string | null;
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
  releaseApprovalPipeline,
  activeRouteId,
  activeWindowId,
  activeLaneId,
  activeBoardId,
  compact = false,
  nested = false,
  eyebrow = "Windows",
  title,
  summary
}: WindowSharedStateBoardProps) {
  const activeLane = resolveActiveWindowSharedStateLane(windowing, activeLaneId, activeBoardId, activeRouteId);
  const activeWindow = resolveActiveWindowRosterEntry(windowing, activeWindowId, activeLane, activeRouteId);
  const activeBoard = resolveActiveOrchestrationBoard(windowing, activeBoardId, activeLane, activeRouteId);
  const activeObservabilityMapping = selectStudioWindowObservabilityActiveMapping(windowing) ?? null;
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
                "The wider review-only delivery chain is unavailable, so this board cannot show how promotion, publish, and rollback stay attached to the active review posture."}
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
