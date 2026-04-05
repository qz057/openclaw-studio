import type { StudioShellState } from "@openclaw/shared";

interface AgentsPageProps {
  agents: StudioShellState["agents"];
}

export function AgentsPage({ agents }: AgentsPageProps) {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Operators</p>
          <h1>Agents</h1>
        </div>
        <p className="page-summary">{agents.summary}</p>
      </div>

      <div className="metric-grid metric-grid--compact">
        {agents.metrics.map((metric) => (
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
              <h2>Roster</h2>
              <p>Demo roster cards that mirror the future live agent lane shape.</p>
            </div>
            <span>{agents.roster.length} lanes</span>
          </div>
          <div className="stack-list">
            {agents.roster.map((agent) => (
              <article key={agent.id} className="list-row list-row--stacked">
                <div className="row-heading">
                  <div>
                    <strong>{agent.name}</strong>
                    <p>
                      {agent.id} · {agent.role}
                    </p>
                  </div>
                  <span className={`status-chip status-chip--${agent.status}`}>{agent.status}</span>
                </div>
                <p>{agent.focus}</p>
                <div className="row-meta row-meta--compact">
                  <span>{agent.model}</span>
                  <span>{agent.workspace}</span>
                  <span>{agent.approvals}</span>
                  <span>{agent.updatedAt}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="surface card">
          <div className="card-header">
            <div>
              <h2>Recent Activity</h2>
              <p>Structured operator activity is ready to be replaced with runtime events later.</p>
            </div>
          </div>
          <div className="timeline">
            {agents.recentActivity.map((item) => (
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
      </div>
    </section>
  );
}
