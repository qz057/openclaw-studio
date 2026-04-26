import type { StudioShellState } from "@openclaw/shared";

interface SettingsPageProps {
  settings: StudioShellState["settings"];
}

export function SettingsPage({ settings }: SettingsPageProps) {
  const allItems = settings.sections.flatMap((section) => section.items);
  const positiveItems = allItems.filter((item) => item.tone === "positive").length;
  const warningItems = allItems.filter((item) => item.tone === "warning").length;
  const workspaceSection = settings.sections.find((section) => section.id === "settings-workspace") ?? null;
  const runtimeSection = settings.sections.find((section) => section.id === "settings-runtime") ?? null;
  const startupSection = settings.sections.find((section) => section.id === "settings-startup") ?? null;
  const safetySection = settings.sections.find((section) => section.id === "settings-safety") ?? null;

  const toolPolicyItems = (safetySection?.items ?? []).filter((item) => ["settings-scope", "settings-tools-profile"].includes(item.id));
  const pluginItems = (safetySection?.items ?? []).filter((item) => ["settings-plugin-runtime", "settings-mcp-runtime", "settings-advanced"].includes(item.id));

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">配置概览</p>
          <h1>设置</h1>
        </div>
        <p className="page-summary">这里集中查看当前工作区、运行态与安全策略。</p>
      </div>

      <article className="surface card">
        <div className="card-header card-header--stack">
          <div>
            <h2>当前配置概览</h2>
            <p>{settings.summary}</p>
          </div>
        </div>
      </article>

      <div className="metric-grid metric-grid--compact">
        <article className="surface stat-pill stat-pill--positive">
          <span>正常项</span>
          <strong>{positiveItems}</strong>
        </article>
        <article className="surface stat-pill stat-pill--warning">
          <span>需关注</span>
          <strong>{warningItems}</strong>
        </article>
        <article className="surface stat-pill stat-pill--neutral">
          <span>分组</span>
          <strong>{settings.sections.length}</strong>
        </article>
      </div>

      <div className="content-grid">
        {[runtimeSection, workspaceSection, startupSection, safetySection].filter(Boolean).map((section) => (
          <article key={section!.id} className="surface card">
            <div className="card-header card-header--stack">
              <div>
                <h2>{section!.title}</h2>
                <p>{section!.description}</p>
              </div>
              <span>{section!.items.length} 项</span>
            </div>
            <div className="setting-list">
              {section!.items.map((item) => (
                <article key={item.id} className="setting-row">
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <div className="setting-meta">
                    <span className={`tone-chip tone-chip--${item.tone}`}>{item.value}</span>
                  </div>
                </article>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="content-grid">
        <article className="surface card">
          <div className="card-header">
            <div>
              <h2>工具策略</h2>
              <p>聚合当前执行范围与工具策略。</p>
            </div>
          </div>
          <div className="stack-list">
            {toolPolicyItems.map((item) => (
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

        <article className="surface card">
          <div className="card-header">
            <div>
              <h2>插件与 MCP</h2>
              <p>把插件运行态和 MCP 根路径集中到一起查看。</p>
            </div>
          </div>
          <div className="stack-list">
            {pluginItems.map((item) => (
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
      </div>
    </section>
  );
}
