import type { SessionSummary } from "@openclaw/shared";

interface SessionsPageProps {
  sessions: SessionSummary[];
}

export function SessionsPage({ sessions }: SessionsPageProps) {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Sessions</h1>
        </div>
        <p className="page-summary">Usable Phase 1 list skeleton for active and recent session work.</p>
      </div>

      <article className="surface card">
        <div className="table-header">
          <h2>Session Queue</h2>
          <span>{sessions.length} entries</span>
        </div>
        <div className="session-list">
          {sessions.map((session) => (
            <article key={session.id} className="list-row">
              <div>
                <strong>{session.title}</strong>
                <p>
                  {session.id} · {session.workspace}
                </p>
              </div>
              <span className={`status-chip status-chip--${session.status}`}>{session.status}</span>
              <div className="row-meta">
                <span>{session.owner}</span>
                <span>{session.updatedAt}</span>
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
