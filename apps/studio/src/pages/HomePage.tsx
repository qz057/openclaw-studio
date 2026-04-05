import type { StudioShellState } from "@openclaw/shared";
import { ContextualCommandPanel, type ContextualCommandPanelProps } from "../components/ContextualCommandPanel";
import { FocusedSlotToolbar } from "../components/FocusedSlotToolbar";
import { formatHostTraceIntent, resolveHostTraceFocus, resolveHostTraceTone } from "../components/host-trace-state";

interface HomePageProps {
  state: StudioShellState;
  focusedSlotId: string | null;
  onFocusedSlotChange: (slotId: string) => void;
  commandPanel: ContextualCommandPanelProps;
}

export function HomePage({ state, focusedSlotId, onFocusedSlotChange, commandPanel }: HomePageProps) {
  const hostTraceFocus = resolveHostTraceFocus(state.boundary.hostExecutor, focusedSlotId);
  const visiblePanels = state.home.panels.map((panel) => {
    if (panel.id !== "focus" || !hostTraceFocus) {
      return panel;
    }

    return {
      ...panel,
      title: "Focused Bridge Slot",
      description: `${hostTraceFocus.slot.label} now drives the Home focus panel in the same disabled placeholder flow used by the inspector, dock, and trace panels.`,
      stats: [
        { label: "Intent", value: formatHostTraceIntent(hostTraceFocus.slot.intent), tone: "neutral" },
        { label: "Result", value: hostTraceFocus.slot.primaryStatus, tone: resolveHostTraceTone(hostTraceFocus.slot.primaryStatus) },
        { label: "Rollback", value: hostTraceFocus.slot.rollbackDisposition, tone: resolveHostTraceTone(hostTraceFocus.slot.rollbackDisposition) }
      ]
    };
  });
  const recentActivity = hostTraceFocus
    ? [
        {
          id: "activity-focused-slot",
          title: `Focused slot stays on ${hostTraceFocus.slot.label}`,
          detail: `${hostTraceFocus.previewSummary} Home keeps this scope visible even if the page is revisited or refreshed.`,
          timestamp: "Now"
        },
        ...state.home.recentActivity
      ]
    : state.home.recentActivity;

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Home</h1>
        </div>
        <p className="page-summary">{state.home.headline}</p>
      </div>

      <FocusedSlotToolbar hostExecutor={state.boundary.hostExecutor} focusedSlotId={focusedSlotId} onFocusedSlotChange={onFocusedSlotChange} />

      <ContextualCommandPanel {...commandPanel} />

      <div className="panel-grid">
        {visiblePanels.map((panel) => (
          <article key={panel.id} className={panel.id === "focus" && hostTraceFocus ? "surface card focus-context-card focus-context-card--active" : "surface card"}>
            <div className="card-header">
              <div>
                <h2>{panel.title}</h2>
                <p>{panel.description}</p>
              </div>
            </div>
            <div className="stats-grid">
              {panel.stats.map((stat) => (
                <div key={stat.label} className={`stat-pill stat-pill--${stat.tone}`}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <article className="surface card">
        <div className="card-header">
          <div>
            <h2>Recent Activity</h2>
            <p>Mock timeline delivered through the shared contract.</p>
          </div>
        </div>
        <div className="timeline">
          {recentActivity.map((item) => (
            <div key={item.id} className="timeline-item">
              <div className="timeline-marker" />
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
              <span className="timestamp">{item.timestamp}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
