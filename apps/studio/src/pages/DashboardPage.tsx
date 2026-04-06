import type { SettingItem, ShellStatus, StudioPageId, StudioShellState } from "@openclaw/shared";
import { BoundarySummaryCard } from "../components/BoundarySummaryCard";
import { ContextualCommandPanel, type ContextualCommandPanelProps } from "../components/ContextualCommandPanel";
import { FocusedSlotToolbar } from "../components/FocusedSlotToolbar";
import { formatHostTraceIntent, resolveHostTraceFocus, resolveHostTraceTone } from "../components/host-trace-state";
import { WindowSharedStateBoard } from "../components/WindowSharedStateBoard";

interface DashboardWindowingSurfaceProps {
  activeRouteId: StudioPageId;
  activeWindowId: string | null;
  activeLaneId: string | null;
  activeBoardId: string | null;
}

interface DashboardPageProps {
  dashboard: StudioShellState["dashboard"];
  boundary: StudioShellState["boundary"];
  windowing: StudioShellState["windowing"];
  status: ShellStatus;
  focusedSlotId: string | null;
  onFocusedSlotChange: (slotId: string) => void;
  commandPanel: ContextualCommandPanelProps;
  windowingSurface: DashboardWindowingSurfaceProps;
}

function SystemCheckCard({ check }: { check: SettingItem }) {
  return (
    <article className="system-check-card">
      <div className="card-header card-header--stack">
        <div>
          <h3>{check.label}</h3>
          <p>{check.detail}</p>
        </div>
        <span className={`tone-chip tone-chip--${check.tone}`}>{check.value}</span>
      </div>
    </article>
  );
}

export function DashboardPage({
  dashboard,
  boundary,
  windowing,
  status,
  focusedSlotId,
  onFocusedSlotChange,
  commandPanel,
  windowingSurface
}: DashboardPageProps) {
  const hostTraceFocus = resolveHostTraceFocus(boundary.hostExecutor, focusedSlotId);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Program View</p>
          <h1>Dashboard</h1>
        </div>
        <p className="page-summary">{dashboard.headline}</p>
      </div>

      <FocusedSlotToolbar hostExecutor={boundary.hostExecutor} focusedSlotId={focusedSlotId} onFocusedSlotChange={onFocusedSlotChange} />

      <ContextualCommandPanel {...commandPanel} />

      <BoundarySummaryCard boundary={boundary} eyebrow="Boundary" />

      {hostTraceFocus ? (
        <div className="focus-context-grid">
          <article className="surface card focus-context-card focus-context-card--active">
            <div className="card-header card-header--stack">
              <div>
                <h2>Dashboard Focus Context</h2>
                <p>Program-level host bridge summaries now stay scoped to the same focused slot as the inspector, dock, and trace panel.</p>
              </div>
              <span className={`tone-chip tone-chip--${resolveHostTraceTone(hostTraceFocus.slot.primaryStatus)}`}>{hostTraceFocus.slot.primaryStatus}</span>
            </div>
            <div className="focus-context-list">
              <article className="focus-context-line">
                <span>Focused slot</span>
                <strong>{hostTraceFocus.slot.label}</strong>
                <p>{hostTraceFocus.summary}</p>
              </article>
              <article className="focus-context-line">
                <span>Intent</span>
                <strong>{formatHostTraceIntent(hostTraceFocus.slot.intent)}</strong>
                <p>{hostTraceFocus.previewSummary}</p>
              </article>
            </div>
          </article>

          <article className="surface card focus-context-card">
            <div className="card-header card-header--stack">
              <div>
                <h2>Dashboard Focus Signals</h2>
                <p>Secondary watch cards keep the current handler, validator, rollback, and blocker posture visible while execution remains disabled.</p>
              </div>
              <span>{boundary.currentLayer}</span>
            </div>
            <div className="focus-context-list">
              <article className="focus-context-line">
                <span>Handler / validator</span>
                <strong>
                  {hostTraceFocus.slot.handlerState} / {hostTraceFocus.slot.validatorState}
                </strong>
                <p>{hostTraceFocus.validationDetail}</p>
              </article>
              <article className="focus-context-line">
                <span>Rollback / blockers</span>
                <strong>
                  {hostTraceFocus.slot.rollbackDisposition} / {boundary.blockedReasons.length} active
                </strong>
                <p>{hostTraceFocus.rollbackAuditDetail}</p>
              </article>
            </div>
          </article>
        </div>
      ) : null}

      <WindowSharedStateBoard
        windowing={windowing}
        releaseApprovalPipeline={boundary.hostExecutor.releaseApprovalPipeline}
        activeRouteId={windowingSurface.activeRouteId}
        activeWindowId={windowingSurface.activeWindowId}
        activeLaneId={windowingSurface.activeLaneId}
        activeBoardId={windowingSurface.activeBoardId}
        compact
        title="Dashboard Cross-window Board"
        summary="Program-level review now includes the same window roster, shared-state lane, orchestration board, review posture ownership map, reviewer queue, acknowledgement state, escalation/closeout windows, sync health, and blocker posture shown in the shell workbench."
      />

      <div className="metric-grid">
        {dashboard.metrics.map((metric) => (
          <article key={metric.id} className="surface card metric-card">
            <span className="metric-label">{metric.label}</span>
            <strong className="metric-value">{metric.value}</strong>
            <p>{metric.detail}</p>
            <span className={`tone-chip tone-chip--${metric.tone}`}>{metric.tone}</span>
          </article>
        ))}
      </div>

      <div className="content-grid">
        <article className="surface card">
          <div className="card-header">
            <div>
              <h2>Workstreams</h2>
              <p>Current local runtime lanes observed through the bridge.</p>
            </div>
            <span>{dashboard.workstreams.length} tracked</span>
          </div>
          <div className="stack-list">
            {dashboard.workstreams.map((workstream) => (
              <article key={workstream.id} className="list-row list-row--stacked">
                <div className="row-heading">
                  <strong>{workstream.title}</strong>
                  <span className={`tone-chip tone-chip--${workstream.tone}`}>{workstream.stage}</span>
                </div>
                <p>{workstream.detail}</p>
                <div className="row-meta row-meta--compact">
                  <span>{workstream.owner}</span>
                  <span>{workstream.updatedAt}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="surface card">
          <div className="card-header">
            <div>
              <h2>Watchlist</h2>
              <p>Current guardrails and notable local runtime constraints.</p>
            </div>
            <span>{status.mode}</span>
          </div>
          <div className="stack-list">
            {dashboard.alerts.map((alert) => (
              <article key={alert.id} className="list-row list-row--stacked">
                <div className="row-heading">
                  <strong>{alert.title}</strong>
                  <span className={`tone-chip tone-chip--${alert.tone}`}>{alert.tone}</span>
                </div>
                <p>{alert.detail}</p>
              </article>
            ))}
          </div>
        </article>
      </div>

      <article className="surface card">
        <div className="card-header">
          <div>
            <h2>System Checks</h2>
            <p>Local runtime observations with typed fallback when a probe is unavailable.</p>
          </div>
          <span>{status.runtime}</span>
        </div>
        <div className="system-check-grid">
          {dashboard.systemChecks.map((check) => (
            <SystemCheckCard key={check.id} check={check} />
          ))}
        </div>
      </article>
    </section>
  );
}
