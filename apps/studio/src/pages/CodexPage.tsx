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
  return source === "runtime" ? "runtime" : "非实时";
}

function hasLiveObservation(item: SettingItem): boolean {
  const text = `${item.value} ${item.detail}`.toLowerCase();
  return !/(fallback|mock|模拟|回退|未采样|未采集|未读取|暂无|不可用)/i.test(text);
}

export function CodexPage({ summary, stats, tasks, observations, loopSummary, loopStats, loopSignals, contextSummary, contextNotes }: CodexPageProps) {
  const runtimeTasks = tasks.filter((task) => task.source === "runtime");
  const liveObservations = observations.filter(hasLiveObservation);
  const liveLoopSignals = loopSignals.filter(hasLiveObservation);
  const liveContextNotes = contextNotes.filter(hasLiveObservation);
  const leadTask = runtimeTasks[0] ?? null;

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
            {runtimeTasks.length > 0 ? (
              runtimeTasks.map((task) => (
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
              ))
            ) : (
              <article className="list-row list-row--stacked">
                <strong>未检测到实时 Codex 任务</strong>
                <p>已隐藏非实时 fallback 任务；等待本机 ~/.codex/sessions 产生可读任务后显示。</p>
              </article>
            )}
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

            {liveObservations.map((item) => (
              <div key={item.id} className="placeholder-block">
                <strong>{item.label}</strong>
                <p>{item.value}</p>
                <p>{item.detail}</p>
              </div>
            ))}
            {liveObservations.length === 0 ? (
              <div className="placeholder-block">
                <strong>未检测到实时信号</strong>
                <p>已隐藏缺少实时连接依据的观测项。</p>
              </div>
            ) : null}
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
            {liveLoopSignals.map((item) => (
              <div key={item.id} className="placeholder-block">
                <strong>{item.label}</strong>
                <p>{item.value}</p>
                <p>{item.detail}</p>
              </div>
            ))}
            {liveLoopSignals.length === 0 ? (
              <div className="placeholder-block">
                <strong>未检测到实时回合信号</strong>
                <p>已隐藏 fallback 回合信息。</p>
              </div>
            ) : null}
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
            {liveContextNotes.map((item) => (
              <div key={item.id} className="placeholder-block">
                <strong>{item.label}</strong>
                <p>{item.value}</p>
                <p>{item.detail}</p>
              </div>
            ))}
            {liveContextNotes.length === 0 ? (
              <div className="placeholder-block">
                <strong>未检测到实时上下文</strong>
                <p>已隐藏缺少本机读数支撑的上下文项。</p>
              </div>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
