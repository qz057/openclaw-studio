import type { CodexTaskSummary, SettingItem, StudioStat } from "@openclaw/shared";

interface CodexPageProps {
  summary: string;
  stats: StudioStat[];
  tasks: CodexTaskSummary[];
  observations: SettingItem[];
}

export function CodexPage({ summary, stats, tasks, observations }: CodexPageProps) {
  const leadTask = tasks[0] ?? null;

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Workbench</p>
          <h1>Codex</h1>
        </div>
        <p className="page-summary">{summary}</p>
      </div>

      <div className="panel-grid">
        {stats.map((stat) => (
          <article key={stat.label} className={`surface stat-pill stat-pill--${stat.tone}`}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </div>

      <div className="codex-grid">
        <article className="surface card">
          <div className="card-header">
            <div>
              <h2>Task Stream</h2>
              <p>Renderer stays safe on fallback, but recent local Codex session metadata now flows through when available.</p>
            </div>
          </div>
          <div className="task-list">
            {tasks.map((task) => (
              <article key={task.id} className="list-row list-row--stacked">
                <div>
                  <strong>{task.title}</strong>
                  <p>
                    {task.id} · {task.target}
                  </p>
                  {task.detail ? <p>{task.detail}</p> : null}
                  {task.workdir ? (
                    <div className="row-meta row-meta--compact">
                      <span>{task.workdir}</span>
                    </div>
                  ) : null}
                </div>
                <div className="row-meta row-meta--compact">
                  <span>{task.model}</span>
                  <span>{task.source}</span>
                  <span className={`status-chip status-chip--${task.status}`}>{task.status}</span>
                  <span>{task.updatedAt}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="surface card">
          <div className="card-header">
            <div>
              <h2>Observed Signal</h2>
              <p>Live metadata is read from local session/config surfaces when stable enough to trust.</p>
            </div>
          </div>
          <div className="section-stack">
            {leadTask ? (
              <div className="placeholder-block">
                <strong>{leadTask.title}</strong>
                <p>{leadTask.detail ?? "Recent Codex session metadata is available for this task."}</p>
                <div className="row-meta row-meta--compact">
                  <span>{leadTask.target}</span>
                  <span>{leadTask.status}</span>
                  <span>{leadTask.updatedAt}</span>
                </div>
                {leadTask.workdir ? (
                  <div className="row-meta row-meta--compact">
                    <span>{leadTask.workdir}</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="placeholder-block">
                <strong>No recent task signal</strong>
                <p>The page will stay on typed fallback if local Codex sessions cannot be observed safely.</p>
              </div>
            )}

            {observations.map((item) => (
              <div key={item.id} className="placeholder-block">
                <strong>{item.label}</strong>
                <p>{item.value}</p>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
