import type { CodexTaskSummary, SettingItem, StudioStat } from "@openclaw/shared";

interface CodexPageProps {
  summary: string;
  stats: StudioStat[];
  tasks: CodexTaskSummary[];
  observations: SettingItem[];
  loopSummary: string;
  loopStats: StudioStat[];
  loopSignals: SettingItem[];
  contextSummary: string;
  contextNotes: SettingItem[];
}

function formatLoopState(state: CodexTaskSummary["loopState"]): string {
  switch (state) {
    case "stable":
      return "稳定";
    case "continuing":
      return "继续中";
    case "recovering":
      return "恢复中";
    case "interrupted":
      return "已中断";
    case "complete":
      return "已完成";
    default:
      return "已记录";
  }
}

function formatTaskSource(source: CodexTaskSummary["source"]): string {
  return source === "runtime" ? "runtime" : "fallback";
}

export function CodexPage({ summary, stats, tasks, observations, loopSummary, loopStats, loopSignals, contextSummary, contextNotes }: CodexPageProps) {
  const leadTask = tasks[0] ?? null;

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">任务概览</p>
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
              <h2>任务流</h2>
              <p>按时间查看最近任务、目标与回合状态。</p>
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
                  {task.continuation ? <p>{task.continuation}</p> : null}
                  {task.workdir ? (
                    <div className="row-meta row-meta--compact">
                      <span>{task.workdir}</span>
                    </div>
                  ) : null}
                </div>
                <div className="row-meta row-meta--compact">
                  <span>{task.model}</span>
                  <span>{formatTaskSource(task.source)}</span>
                  <span className={`status-chip status-chip--${task.status}`}>{task.status}</span>
                  {task.loopState ? <span>{formatLoopState(task.loopState)}</span> : null}
                  {typeof task.turnCount === "number" ? <span>{task.turnCount} 回合</span> : null}
                  <span>{task.updatedAt}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="surface card">
          <div className="card-header">
            <div>
              <h2>关键信号</h2>
              <p>优先突出当前任务和最近读数，方便快速判断进展。</p>
            </div>
          </div>
          <div className="section-stack">
            {leadTask ? (
              <div className="placeholder-block">
                <strong>{leadTask.title}</strong>
                <p>{leadTask.detail ?? "当前任务已写入最近一条可用读数。"}</p>
                <div className="row-meta row-meta--compact">
                  <span>{leadTask.target}</span>
                  <span>{leadTask.status}</span>
                  {leadTask.loopState ? <span>{formatLoopState(leadTask.loopState)}</span> : null}
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
                <strong>暂无最近任务</strong>
                <p>当前还没有可用任务信号，页面会继续显示基础读数。</p>
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

        <article className="surface card">
          <div className="card-header">
            <div>
              <h2>回合进展</h2>
              <p>只读展示当前回合状态、延续情况、恢复标记与中断信息。</p>
            </div>
          </div>
          <div className="panel-grid">
            {loopStats.map((stat) => (
              <article key={stat.label} className={`surface stat-pill stat-pill--${stat.tone}`}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </div>
          <div className="section-stack">
            <div className="placeholder-block">
              <strong>回合摘要</strong>
              <p>{loopSummary}</p>
            </div>
            {loopSignals.map((item) => (
              <div key={item.id} className="placeholder-block">
                <strong>{item.label}</strong>
                <p>{item.value}</p>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface card">
          <div className="card-header">
            <div>
              <h2>项目上下文</h2>
              <p>整理当前工作区上下文、稳定文档与最近连续性信息。</p>
            </div>
          </div>
          <div className="section-stack">
            <div className="placeholder-block">
              <strong>上下文摘要</strong>
              <p>{contextSummary}</p>
            </div>
            {contextNotes.map((item) => (
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
