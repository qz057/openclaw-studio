import type { CodexTaskSummary } from "@openclaw/shared";

interface CodexPageProps {
  summary: string;
  tasks: CodexTaskSummary[];
}

export function CodexPage({ summary, tasks }: CodexPageProps) {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Workbench</p>
          <h1>Codex</h1>
        </div>
        <p className="page-summary">{summary}</p>
      </div>

      <div className="codex-grid">
        <article className="surface card">
          <div className="card-header">
            <div>
              <h2>Task Stream</h2>
              <p>Typed IPC path ready for live runtime replacement later.</p>
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
                </div>
                <div className="row-meta row-meta--compact">
                  <span>{task.model}</span>
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
              <h2>Task Detail</h2>
              <p>Phase 1 placeholder for future trace, plan, and approval views.</p>
            </div>
          </div>
          <div className="placeholder-block">
            <strong>Selected Task</strong>
            <p>Choose a queued or running task to inspect runtime state, approvals, and logs in later phases.</p>
          </div>
        </article>
      </div>
    </section>
  );
}
