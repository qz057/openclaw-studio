import type { SessionSummary } from "@openclaw/shared";

interface SessionsPageProps {
  sessions: SessionSummary[];
}

export function SessionsPage({ sessions }: SessionsPageProps) {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">会话中心</p>
          <h1>会话</h1>
        </div>
        <p className="page-summary">这里展示当前与最近会话，作为中间主工作区的核心视图。</p>
      </div>

      <article className="surface card">
        <div className="table-header">
          <h2>会话队列</h2>
          <span>{sessions.length} 条</span>
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
              <span className={`status-chip status-chip--${session.status}`}>
                {session.status === "active" ? "进行中" : session.status === "waiting" ? "等待中" : session.status === "complete" ? "已完成" : session.status}
              </span>
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
