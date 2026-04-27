import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { StudioDeviceBootstrapCheckStatus, StudioDeviceBootstrapState, StudioShellState, StudioTone } from "@openclaw/shared";
import { loadDeviceBootstrapState } from "@openclaw/bridge";
import { formatProductText } from "../lib/product-text";

interface SettingsPageProps {
  settings: StudioShellState["settings"];
}

function resolveBootstrapTone(status: StudioDeviceBootstrapCheckStatus | StudioDeviceBootstrapState["overall"]): StudioTone {
  return status === "ready" ? "positive" : status === "partial" || status === "warning" ? "warning" : "warning";
}

function formatBootstrapStatus(status: StudioDeviceBootstrapCheckStatus | StudioDeviceBootstrapState["overall"]): string {
  switch (status) {
    case "ready":
      return "就绪";
    case "partial":
      return "部分接入";
    case "warning":
      return "需处理";
    case "missing":
      return "缺失";
    case "blocked":
      return "阻断";
  }
}

function formatCommandSafety(safety: StudioDeviceBootstrapState["commands"][number]["safety"]): string {
  switch (safety) {
    case "read-only":
      return "只读";
    case "setup":
      return "配置";
    case "secret":
      return "凭据";
  }
}

export function SettingsPage({ settings }: SettingsPageProps) {
  const [bootstrapState, setBootstrapState] = useState<StudioDeviceBootstrapState | null>(null);
  const [bootstrapBusy, setBootstrapBusy] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const allItems = settings.sections.flatMap((section) => section.items);
  const positiveItems = allItems.filter((item) => item.tone === "positive").length;
  const warningItems = allItems.filter((item) => item.tone === "warning").length;
  const workspaceSection = settings.sections.find((section) => section.id === "settings-workspace") ?? null;
  const runtimeSection = settings.sections.find((section) => section.id === "settings-runtime") ?? null;
  const startupSection = settings.sections.find((section) => section.id === "settings-startup") ?? null;
  const safetySection = settings.sections.find((section) => section.id === "settings-safety") ?? null;

  const toolPolicyItems = (safetySection?.items ?? []).filter((item) => ["settings-scope", "settings-tools-profile"].includes(item.id));
  const pluginItems = (safetySection?.items ?? []).filter((item) => ["settings-plugin-runtime", "settings-mcp-runtime", "settings-advanced"].includes(item.id));
  const readyBootstrapChecks = bootstrapState?.checks.filter((check) => check.status === "ready").length ?? 0;
  const needsBootstrapChecks = bootstrapState?.checks.filter((check) => check.status !== "ready").length ?? 0;
  const checkedAt = bootstrapState ? new Date(bootstrapState.host.checkedAt).toLocaleString("zh-CN") : "未检测";

  async function refreshBootstrapState() {
    setBootstrapBusy(true);
    setBootstrapError(null);

    try {
      setBootstrapState(await loadDeviceBootstrapState());
    } catch (cause) {
      setBootstrapError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBootstrapBusy(false);
    }
  }

  useEffect(() => {
    void refreshBootstrapState();
  }, []);

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
            <p>{formatProductText(settings.summary)}</p>
          </div>
        </div>
      </article>

      <article className="surface card device-bootstrap-card">
        <div className="card-header card-header--stack">
          <div>
            <h2>跨设备接入向导</h2>
            <p>{bootstrapState ? bootstrapState.summary : bootstrapError ? "设备接入检测失败，请查看错误信息。" : "正在读取本机运行态。"}</p>
          </div>
          <button type="button" className="secondary-button device-bootstrap-refresh" onClick={() => void refreshBootstrapState()} disabled={bootstrapBusy}>
            <RefreshCw size={16} aria-hidden="true" />
            <span>{bootstrapBusy ? "检测中" : "重新检测"}</span>
          </button>
        </div>

        {bootstrapError ? <p className="device-bootstrap-error">{bootstrapError}</p> : null}

        {bootstrapState ? (
          <>
            <div className="metric-grid metric-grid--compact device-bootstrap-metrics">
              <article className={`surface stat-pill stat-pill--${resolveBootstrapTone(bootstrapState.overall)}`}>
                <span>整体状态</span>
                <strong>{formatBootstrapStatus(bootstrapState.overall)}</strong>
              </article>
              <article className="surface stat-pill stat-pill--positive">
                <span>就绪项</span>
                <strong>{readyBootstrapChecks}</strong>
              </article>
              <article className={needsBootstrapChecks > 0 ? "surface stat-pill stat-pill--warning" : "surface stat-pill stat-pill--neutral"}>
                <span>需处理</span>
                <strong>{needsBootstrapChecks}</strong>
              </article>
            </div>

            <div className="device-bootstrap-host">
              <span>{bootstrapState.host.platform} / {bootstrapState.host.arch}</span>
              <span>{bootstrapState.host.homeDir}</span>
              <span>{checkedAt}</span>
            </div>

            <div className="content-grid device-bootstrap-grid">
              <section>
                <div className="section-heading">
                  <h3>接入检测</h3>
                  <span>{bootstrapState.checks.length} 项</span>
                </div>
                <div className="setting-list">
                  {bootstrapState.checks.map((check) => (
                    <article key={check.id} className="setting-row device-bootstrap-check">
                      <div>
                        <strong>{check.label}</strong>
                        <p>{check.detail}</p>
                        {check.path ? <code>{check.path}</code> : null}
                        {check.evidence ? <span className="row-meta row-meta--compact">{check.evidence}</span> : null}
                      </div>
                      <div className="setting-meta">
                        <span className={`tone-chip tone-chip--${resolveBootstrapTone(check.status)}`}>{formatBootstrapStatus(check.status)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section>
                <div className="section-heading">
                  <h3>复测命令</h3>
                  <span>{bootstrapState.commands.length} 条</span>
                </div>
                <div className="stack-list">
                  {bootstrapState.commands.map((command) => (
                    <article key={command.id} className="list-row list-row--stacked device-bootstrap-command">
                      <div className="row-heading">
                        <strong>{command.label}</strong>
                        <span className={`tone-chip tone-chip--${command.safety === "secret" ? "warning" : "neutral"}`}>
                          {formatCommandSafety(command.safety)}
                        </span>
                      </div>
                      <code>{command.command}</code>
                      <p>{command.detail}</p>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div className="device-bootstrap-migration">
              <div>
                <h3>迁移边界</h3>
                <p>{bootstrapState.migration.secretPolicy}</p>
                <p>{bootstrapState.migration.portableReadiness}</p>
              </div>
              <div className="content-grid">
                <section>
                  <h3>导出</h3>
                  <ul>
                    {bootstrapState.migration.exportPlan.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3>导入</h3>
                  <ul>
                    {bootstrapState.migration.importPlan.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </>
        ) : null}
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
                <h2>{formatProductText(section!.title)}</h2>
                <p>{formatProductText(section!.description)}</p>
              </div>
              <span>{section!.items.length} 项</span>
            </div>
            <div className="setting-list">
              {section!.items.map((item) => (
                <article key={item.id} className="setting-row">
                  <div>
                    <strong>{formatProductText(item.label)}</strong>
                    <p>{formatProductText(item.detail)}</p>
                  </div>
                  <div className="setting-meta">
                    <span className={`tone-chip tone-chip--${item.tone}`}>{formatProductText(item.value)}</span>
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
                  <strong>{formatProductText(item.label)}</strong>
                  <span className={`tone-chip tone-chip--${item.tone}`}>{formatProductText(item.value)}</span>
                </div>
                <p>{formatProductText(item.detail)}</p>
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
                  <strong>{formatProductText(item.label)}</strong>
                  <span className={`tone-chip tone-chip--${item.tone}`}>{formatProductText(item.value)}</span>
                </div>
                <p>{formatProductText(item.detail)}</p>
              </article>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
