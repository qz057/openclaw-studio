import type { StudioShellState } from "@openclaw/shared";

interface AgentsPageProps {
  agents: StudioShellState["agents"];
}

export function AgentsPage({ agents }: AgentsPageProps) {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">代理概览</p>
          <h1>代理</h1>
        </div>
        <p className="page-summary">这里集中查看当前代理分工、会话通道与近期协作状态。</p>
      </div>

      <article className="surface card">
        <div className="card-header card-header--stack">
          <div>
            <h2>当前代理概览</h2>
            <p>{agents.summary}</p>
          </div>
        </div>
        <div className="metric-grid metric-grid--compact">
          {agents.metrics.map((metric) => (
            <article key={metric.id} className="surface stat-pill stat-pill--neutral">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </div>
      </article>

      <div className="content-grid">
        <article className="surface card">
          <div className="card-header">
            <div>
              <h2>代理列表</h2>
              <p>当前可见的代理角色与协作通道。</p>
            </div>
            <span>{agents.roster.length} 条通道</span>
          </div>
          <div className="stack-list">
            {agents.roster.map((agent) => (
              <article key={agent.id} className="list-row list-row--stacked">
                <div className="row-heading">
                  <div>
                    <strong>{agent.name}</strong>
                    <p>{agent.role}</p>
                  </div>
                  <span className={`status-chip status-chip--${agent.status}`}>{agent.status}</span>
                </div>
                <p>{agent.focus}</p>
                <div className="live-mapping-grid">
                  <div className="live-mapping-item">
                    <span>来源</span>
                    <strong>{agent.source ?? "未知"}</strong>
                  </div>
                  <div className="live-mapping-item">
                    <span>提供方</span>
                    <strong>{agent.provider ?? "未知"}</strong>
                  </div>
                  <div className="live-mapping-item">
                    <span>会话数</span>
                    <strong>{typeof agent.sessionCount === "number" ? agent.sessionCount : "-"}</strong>
                  </div>
                  <div className="live-mapping-item">
                    <span>工作目录</span>
                    <strong>{agent.cwd ?? agent.workspace}</strong>
                  </div>
                </div>
                <div className="row-meta row-meta--compact">
                  <span>{agent.model}</span>
                  <span>{agent.workspace}</span>
                  {agent.approvals ? <span>{agent.approvals}</span> : null}
                  {agent.handoff ? <span>{agent.handoff}</span> : null}
                  <span>{agent.updatedAt}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="surface card">
          <div className="card-header">
            <div>
              <h2>最近动态</h2>
              <p>按时间查看当前代理相关的最新变化。</p>
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

      <article className="surface card">
        <div className="card-header">
          <div>
            <h2>协作提示</h2>
            <p>用当前代理与任务读数快速判断下一步协作方向。</p>
          </div>
        </div>
        <div className="stack-list">
          <article className="list-row list-row--stacked">
            <div className="row-heading">
              <strong>当前协作摘要</strong>
            </div>
            <p>{agents.delegationSummary}</p>
          </article>
          {agents.delegationNotes.map((item) => (
            <article key={item.id} className="list-row list-row--stacked">
              <div className="row-heading">
                <strong>{item.label}</strong>
                <span className={`tone-chip tone-chip--${item.tone}`}>{item.value}</span>
              </div>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
