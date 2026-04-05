import type { StudioShellState } from "@openclaw/shared";

interface HomePageProps {
  state: StudioShellState;
}

export function HomePage({ state }: HomePageProps) {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Home</h1>
        </div>
        <p className="page-summary">{state.home.headline}</p>
      </div>

      <div className="panel-grid">
        {state.home.panels.map((panel) => (
          <article key={panel.id} className="surface card">
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
          {state.home.recentActivity.map((item) => (
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
