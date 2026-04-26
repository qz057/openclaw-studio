import { useState } from "react";
import { loadRuntimeItemAction, loadRuntimeItemDetail } from "@openclaw/bridge";
import type { SkillCatalogItem, StudioRuntimeAction, StudioRuntimeActionResult, StudioRuntimeDetail, StudioShellState } from "@openclaw/shared";
import { HostTracePanel } from "../components/HostTracePanel";

interface SkillsPageProps {
  skills: StudioShellState["skills"];
  boundary: StudioShellState["boundary"];
  focusedSlotId: string | null;
  onFocusedSlotChange: (slotId: string) => void;
}

const inspectableItemIds = new Set([
  "tool-openclaw-runtime",
  "tool-openclaw-plugins",
  "tool-codex-runtime",
  "tool-workspace-tooling",
  "mcp-root-scan",
  "mcp-adjacent-runtime"
]);

export function SkillsPage({ skills, boundary, focusedSlotId, onFocusedSlotChange }: SkillsPageProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [detail, setDetail] = useState<StudioRuntimeDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionResult, setActionResult] = useState<StudioRuntimeActionResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const allItems = skills.sections.flatMap((section) => section.items);
  const runtimeItemCount = allItems.filter((item) => item.source === "runtime").length;
  const inspectableCount = allItems.filter((item) => inspectableItemIds.has(item.id)).length;
  const rootsScannedItem = allItems.find((item) => item.id === "skill-source-roots-scanned") ?? null;
  const pluginPathsItem = allItems.find((item) => item.id === "skill-source-plugin-load-paths") ?? null;
  const mcpRootsItem = allItems.find((item) => item.id === "skill-source-mcp-roots") ?? null;
  const selectedItem = allItems.find((entry) => entry.id === selectedItemId) ?? null;

  async function inspectItem(item: SkillCatalogItem) {
    setSelectedItemId(item.id);
    setDetailLoading(true);
    setDetailError(null);
    setActionResult(null);
    setActionError(null);
    setActionLoadingId(null);

    try {
      const nextDetail = await loadRuntimeItemDetail(item.id);
      setDetail(nextDetail);
    } catch (error) {
      setDetail(null);
      setDetailError(error instanceof Error ? error.message : "详情加载失败。");
    } finally {
      setDetailLoading(false);
    }
  }

  async function runAction(action: StudioRuntimeAction) {
    if (!selectedItemId) {
      return;
    }

    setActionLoadingId(action.id);
    setActionError(null);

    try {
      const nextResult = await loadRuntimeItemAction(selectedItemId, action.id);
      setActionResult(nextResult);
      const nextSlotId = nextResult?.hostHandoff?.mapping.slotId;

      if (nextSlotId) {
        onFocusedSlotChange(nextSlotId);
      }

      if (action.refreshDetailOnSuccess) {
        const refreshedDetail = await loadRuntimeItemDetail(selectedItemId);
        setDetail(refreshedDetail);
      }
    } catch (error) {
      setActionResult(null);
      setActionError(error instanceof Error ? error.message : "动作执行失败。");
    } finally {
      setActionLoadingId(null);
    }
  }

  const visibleBoundary = actionResult?.boundary ?? detail?.boundary ?? boundary;

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">能力概览</p>
          <h1>技能与工具</h1>
        </div>
        <p className="page-summary">这里集中查看当前可用能力、根路径与详情，支持只读检查和安全动作。</p>
      </div>

      <div className="metric-grid metric-grid--compact">
        <article className="surface stat-pill stat-pill--neutral">
          <span>分组</span>
          <strong>{skills.sections.length}</strong>
        </article>
        <article className="surface stat-pill stat-pill--positive">
          <span>运行态条目</span>
          <strong>{runtimeItemCount}</strong>
        </article>
        <article className="surface stat-pill stat-pill--neutral">
          <span>可查看详情</span>
          <strong>{inspectableCount}</strong>
        </article>
        <article className="surface stat-pill stat-pill--neutral">
          <span>根路径状态</span>
          <strong>{rootsScannedItem?.status ?? "未知"}</strong>
        </article>
        <article className="surface stat-pill stat-pill--neutral">
          <span>插件路径</span>
          <strong>{pluginPathsItem?.status ?? "未知"}</strong>
        </article>
        <article className="surface stat-pill stat-pill--neutral">
          <span>MCP 根路径</span>
          <strong>{mcpRootsItem?.status ?? "未知"}</strong>
        </article>
      </div>

      <div className="content-grid">
        <article className="surface card">
          <div className="card-header">
            <div>
              <h2>已扫描根路径</h2>
              <p>当前实际扫描到的能力根路径。</p>
            </div>
          </div>
          <div className="stack-list">
            <article className="list-row list-row--stacked">
              <strong>{rootsScannedItem?.status ?? "未知"}</strong>
              <p>{rootsScannedItem?.detail ?? "暂无扫描详情。"}</p>
              {rootsScannedItem?.path ? (
                <div className="row-meta row-meta--compact">
                  <span>{rootsScannedItem.path}</span>
                </div>
              ) : null}
            </article>
          </div>
        </article>

        <article className="surface card">
          <div className="card-header">
            <div>
              <h2>插件与 MCP 概览</h2>
              <p>把插件路径和 MCP 根路径放到页首统一查看。</p>
            </div>
          </div>
          <div className="stack-list">
            <article className="list-row list-row--stacked">
              <strong>插件路径</strong>
              <p>{pluginPathsItem?.detail ?? "暂无插件路径详情。"}</p>
              {pluginPathsItem?.path ? (
                <div className="row-meta row-meta--compact">
                  <span>{pluginPathsItem.path}</span>
                </div>
              ) : null}
            </article>
            <article className="list-row list-row--stacked">
              <strong>MCP 根路径</strong>
              <p>{mcpRootsItem?.detail ?? "暂无 MCP 根路径详情。"}</p>
              {mcpRootsItem?.path ? (
                <div className="row-meta row-meta--compact">
                  <span>{mcpRootsItem.path}</span>
                </div>
              ) : null}
            </article>
          </div>
        </article>
      </div>

      <div className="catalog-grid">
        {skills.sections.map((section) => (
          <article key={section.id} className="surface card">
            <div className="card-header card-header--stack">
              <div>
                <h2>{section.label}</h2>
                <p>{section.description}</p>
              </div>
              <span>{section.items.length} 项</span>
            </div>
            <div className="stack-list">
              {section.items.map((item) => {
                const inspectable = inspectableItemIds.has(item.id);

                return (
                  <article key={item.id} className="list-row list-row--stacked">
                    <div className="row-heading">
                      <div>
                        <strong>{item.name}</strong>
                        <p>
                          {item.origin ? `${item.origin} · ` : ""}
                          {item.surface} · {item.source}
                        </p>
                      </div>
                      <span className={`tone-chip tone-chip--${item.tone}`}>{item.status}</span>
                    </div>
                    <p>{item.detail}</p>
                    {item.path ? (
                      <div className="row-meta row-meta--compact">
                        <span>{item.path}</span>
                      </div>
                    ) : null}
                    {inspectable ? (
                      <div className="row-meta row-meta--compact">
                        <button type="button" className="action-button" onClick={() => void inspectItem(item)}>
                          查看详情
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      <article className="surface card detail-card">
        <div className="card-header card-header--stack">
          <div>
            <h2>详情面板</h2>
            <p>选中某个条目后，展示它的只读详情与可执行动作。</p>
          </div>
          {selectedItem ? <span>{selectedItem.name}</span> : <span>未选择</span>}
        </div>

        {detailLoading ? (
          <div className="placeholder-block">
            <strong>正在加载详情</strong>
            <p>正在通过 Electron bridge 拉取当前条目的安全详情。</p>
          </div>
        ) : detailError ? (
          <div className="placeholder-block">
            <strong>详情加载失败</strong>
            <p>{detailError}</p>
          </div>
        ) : detail ? (
          <div className="detail-stack">
            <div className="placeholder-block">
              <strong>{detail.title}</strong>
              <p>{detail.summary}</p>
              {detail.path ? (
                <div className="row-meta row-meta--compact">
                  <span>{detail.path}</span>
                </div>
              ) : null}
            </div>

            {detail.actions?.length ? (
              <div className="placeholder-block">
                <strong>可执行动作</strong>
                <p>这里只显示当前条目允许的只读、dry-run、Studio-local 或 preview-host 动作。</p>
                <div className="action-toolbar">
                  {detail.actions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      className="action-button"
                      onClick={() => void runAction(action)}
                      disabled={Boolean(actionLoadingId)}
                    >
                      {actionLoadingId === action.id ? `正在执行：${action.label}` : action.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="detail-grid">
              {detail.sections.map((section) => (
                <div key={section.id} className="placeholder-block">
                  <strong>{section.title}</strong>
                  <ul className="detail-lines">
                    {section.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {actionLoadingId ? (
              <div className="placeholder-block">
                <strong>正在执行动作</strong>
                <p>当前动作正在执行。</p>
              </div>
            ) : actionError ? (
              <div className="placeholder-block">
                <strong>动作执行失败</strong>
                <p>{actionError}</p>
              </div>
            ) : actionResult ? (
              <div className="detail-stack">
                <div className="placeholder-block">
                  <strong>{actionResult.title}</strong>
                  <p>{actionResult.summary}</p>
                  <div className="row-meta row-meta--compact">
                    <span>{actionResult.action.kind}</span>
                    <span>{actionResult.action.safety}</span>
                    <span>{actionResult.execution.status}</span>
                  </div>
                </div>

                {actionResult.hostHandoff ? (
                  <HostTracePanel
                    hostExecutor={visibleBoundary.hostExecutor}
                    hostPreview={actionResult.hostPreview}
                    hostHandoff={actionResult.hostHandoff}
                    focusedSlotId={focusedSlotId}
                    onFocusedSlotChange={onFocusedSlotChange}
                    nested
                    eyebrow="轨迹"
                    title="当前轨迹结果"
                    summary="仅在当前动作产出 handoff 时显示。"
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="placeholder-block">
            <strong>未选择详情</strong>
            <p>从上方能力列表选择一项后，再查看当前详情。</p>
          </div>
        )}
      </article>
    </section>
  );
}
