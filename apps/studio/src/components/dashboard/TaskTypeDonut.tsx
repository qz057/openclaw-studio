import type { DashboardTaskSlice } from "../../hooks/useDashboardRealtimeData";

interface TaskTypeDonutProps {
  slices: DashboardTaskSlice[];
}

function createGradient(slices: DashboardTaskSlice[]): string {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const colors: Record<string, string> = {
    data: "#2f8cff",
    content: "#2dd4bf",
    knowledge: "#8b5cf6",
    automation: "#f6a33a"
  };

  if (total <= 0) {
    return "conic-gradient(rgba(180, 190, 200, 0.22) 0 100%)";
  }

  let cursor = 0;
  const segments = slices.map((slice) => {
    const start = cursor;
    const width = (slice.value / total) * 100;
    cursor += width;
    return `${colors[slice.id] ?? "#8f98a1"} ${start}% ${cursor}%`;
  });

  return `conic-gradient(${segments.join(", ")})`;
}

export function TaskTypeDonut({ slices }: TaskTypeDonutProps) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <article className="dashboard-panel task-type-donut">
      <div className="dashboard-panel__header">
        <div>
          <p className="eyebrow">TASK MIX</p>
          <h2>任务类型分布</h2>
        </div>
        <span className="dashboard-source-chip">近 24 小时</span>
      </div>
      <div className="task-type-donut__body">
        <div className="task-type-donut__chart" style={{ "--donut-gradient": createGradient(slices) }}>
          <span>
            <strong>{total}</strong>
            <em>总数</em>
          </span>
        </div>
        <div className="task-type-donut__legend">
          {slices.length > 0 ? (
            slices.map((slice) => {
              const percent = total > 0 ? Math.round((slice.value / total) * 100) : 0;

              return (
              <div key={slice.id} className={`task-type-donut__legend-row task-type-donut__legend-row--${slice.id}`}>
                <span>{slice.label}</span>
                <strong>{percent}%</strong>
              </div>
              );
            })
          ) : (
            <div className="dashboard-empty-state">任务状态暂未采样</div>
          )}
        </div>
      </div>
    </article>
  );
}
