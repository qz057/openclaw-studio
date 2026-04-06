import { selectStudioReleaseApprovalPipelineStage, type StudioPageId, type StudioReleaseApprovalPipeline, type StudioShellState } from "@openclaw/shared";

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
  const currentReleaseStage = releaseApprovalPipeline ? selectStudioReleaseApprovalPipelineStage(releaseApprovalPipeline) : null;
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
            <div className="windowing-preview-list">
              <div className="windowing-preview-line">
                <span>Stage ownership</span>
                <strong>{currentReleaseStage ? `${currentReleaseStage.owner} / ${currentReleaseStage.status}` : "Unavailable"}</strong>
              </div>
              <div className="windowing-preview-line">
                <span>Decision handoff</span>
                <strong>{releaseApprovalPipeline.decisionHandoff.posture}</strong>
              </div>
              <div className="windowing-preview-line">
                <span>Evidence closeout</span>
                <strong>{releaseApprovalPipeline.evidenceCloseout.sealingState}</strong>
              </div>
            </div>
          </article>
        ) : null}
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
