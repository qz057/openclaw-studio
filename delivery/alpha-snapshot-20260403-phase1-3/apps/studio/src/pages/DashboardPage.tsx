import type { SettingItem, ShellStatus, StudioShellState } from "@openclaw/shared";

interface DashboardPageProps {
  dashboard: StudioShellState["dashboard"];
  status: ShellStatus;
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

export function DashboardPage({ dashboard, status }: DashboardPageProps) {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Program View</p>
          <h1>Dashboard</h1>
        </div>
        <p className="page-summary">{dashboard.headline}</p>
      </div>

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
              <p>Major milestone lanes for the current alpha rollout.</p>
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
              <p>Known constraints that still matter for the next milestone.</p>
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
            <p>Structured shell status that can be swapped to live data in the next phase.</p>
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
