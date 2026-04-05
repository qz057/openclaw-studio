import { useState } from "react";
import { loadRuntimeItemAction, loadRuntimeItemDetail } from "@openclaw/bridge";
import type { SkillCatalogItem, StudioRuntimeActionResult, StudioRuntimeDetail, StudioShellState } from "@openclaw/shared";
import { BoundarySummaryCard } from "../components/BoundarySummaryCard";
import { ContextualCommandPanel, type ContextualCommandPanelProps } from "../components/ContextualCommandPanel";
import { FocusedSlotToolbar } from "../components/FocusedSlotToolbar";
import { HostTracePanel } from "../components/HostTracePanel";
import { formatHostTraceIntent, resolveHostTraceFocus, resolveHostTraceTone } from "../components/host-trace-state";

interface SkillsPageProps {
  skills: StudioShellState["skills"];
  boundary: StudioShellState["boundary"];
  focusedSlotId: string | null;
  onFocusedSlotChange: (slotId: string) => void;
  commandPanel: ContextualCommandPanelProps;
}

const inspectableItemIds = new Set([
  "tool-openclaw-runtime",
  "tool-openclaw-plugins",
  "tool-codex-runtime",
  "tool-workspace-tooling",
  "mcp-root-scan",
  "mcp-adjacent-runtime"
]);

export function SkillsPage({ skills, boundary, focusedSlotId, onFocusedSlotChange, commandPanel }: SkillsPageProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [detail, setDetail] = useState<StudioRuntimeDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionResult, setActionResult] = useState<StudioRuntimeActionResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const selectedItem = (() => {
    if (!selectedItemId) {
      return null;
    }

    for (const section of skills.sections) {
      const item = section.items.find((entry) => entry.id === selectedItemId);

      if (item) {
        return item;
      }
    }

    return null;
  })();

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
      setDetailError(error instanceof Error ? error.message : "Failed to load detail.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function runAction(actionId: string) {
    if (!selectedItemId) {
      return;
    }

    const itemId = selectedItemId;

    setActionLoadingId(actionId);
    setActionError(null);

    try {
      const nextResult = await loadRuntimeItemAction(itemId, actionId);
      setActionResult(nextResult);
      const nextSlotId = nextResult?.hostHandoff?.mapping.slotId;

      if (nextSlotId) {
        onFocusedSlotChange(nextSlotId);
      }

      const refreshedDetail = await loadRuntimeItemDetail(itemId);
      setDetail(refreshedDetail);
    } catch (error) {
      setActionResult(null);
      setActionError(error instanceof Error ? error.message : "Failed to run action.");
    } finally {
      setActionLoadingId(null);
    }
  }

  const visibleBoundary = actionResult?.boundary ?? detail?.boundary ?? boundary;
  const hostTraceFocus = resolveHostTraceFocus(visibleBoundary.hostExecutor, focusedSlotId);
  const selectedHandoffSlotId = actionResult?.hostHandoff?.mapping.slotId ?? null;
  const focusAlignment =
    !selectedItem
      ? "No runtime item selected."
      : selectedHandoffSlotId
        ? selectedHandoffSlotId === hostTraceFocus?.slot.slotId
          ? "Selected handoff aligns with the current focused slot."
          : "Selected handoff stays available, but the page is currently scoped to another slot."
        : "Select a preview-host action to populate slot-specific trace output.";

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Capabilities</p>
          <h1>Skills / Tools / MCP</h1>
        </div>
        <p className="page-summary">{skills.summary}</p>
      </div>

      <FocusedSlotToolbar hostExecutor={visibleBoundary.hostExecutor} focusedSlotId={focusedSlotId} onFocusedSlotChange={onFocusedSlotChange} />

      <ContextualCommandPanel {...commandPanel} />

      <div className="catalog-grid">
        {skills.sections.map((section) => (
          <article key={section.id} className="surface card">
            <div className="card-header card-header--stack">
              <div>
                <h2>{section.label}</h2>
                <p>{section.description}</p>
              </div>
              <span>{section.items.length} entries</span>
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
                        <button
                          type="button"
                          className="action-button"
                          onClick={() => {
                            void inspectItem(item);
                          }}
                        >
                          Inspect detail
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
            <h2>Runtime detail</h2>
            <p>Read-only drill-down plus dry-run, Studio-local control flows, and blocked host/runtime boundary previews for runtime-backed Tools / MCP items.</p>
          </div>
          {selectedItem ? <span>{selectedItem.name}</span> : <span>No selection</span>}
        </div>

        <BoundarySummaryCard boundary={visibleBoundary} nested eyebrow="Boundary" />

        {hostTraceFocus ? (
          <div className="focus-context-grid focus-context-grid--tight">
            <article className="focus-context-card focus-context-card--active">
              <div className="card-header card-header--stack">
                <div>
                  <h2>Skills Focus Context</h2>
                  <p>Runtime detail keeps the same focused slot summary visible even before a preview-host action runs.</p>
                </div>
                <span className={`tone-chip tone-chip--${resolveHostTraceTone(hostTraceFocus.slot.primaryStatus)}`}>{hostTraceFocus.slot.primaryStatus}</span>
              </div>
              <div className="focus-context-list">
                <article className="focus-context-line">
                  <span>Focused slot</span>
                  <strong>{hostTraceFocus.slot.label}</strong>
                  <p>{hostTraceFocus.summary}</p>
                </article>
                <article className="focus-context-line">
                  <span>Intent / validator</span>
                  <strong>{formatHostTraceIntent(hostTraceFocus.slot.intent)}</strong>
                  <p>{hostTraceFocus.validationDetail}</p>
                </article>
              </div>
            </article>

            <article className="focus-context-card">
              <div className="card-header card-header--stack">
                <div>
                  <h2>Selected Detail Alignment</h2>
                  <p>Secondary page feedback shows whether the current item/action is aligned with the shared slot focus.</p>
                </div>
                <span>{selectedItem?.name ?? "No selection"}</span>
              </div>
              <div className="focus-context-list">
                <article className="focus-context-line">
                  <span>Current alignment</span>
                  <strong>{selectedHandoffSlotId ? (selectedHandoffSlotId === hostTraceFocus.slot.slotId ? "Aligned" : "Scoped elsewhere") : "Pending handoff"}</strong>
                  <p>{focusAlignment}</p>
                </article>
                <article className="focus-context-line">
                  <span>Focused rollback / audit</span>
                  <strong>{hostTraceFocus.rollbackAuditValue}</strong>
                  <p>{hostTraceFocus.rollbackAuditDetail}</p>
                </article>
              </div>
            </article>
          </div>
        ) : null}

        {detailLoading ? (
          <div className="placeholder-block">
            <strong>Loading detail…</strong>
            <p>Fetching a sanitized runtime payload from the Electron bridge.</p>
          </div>
        ) : detailError ? (
          <div className="placeholder-block">
            <strong>Detail failed</strong>
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
              {detail.notices?.length ? (
                <div className="detail-notice-list">
                  {detail.notices.map((notice) => (
                    <p key={notice}>{notice}</p>
                  ))}
                </div>
              ) : null}
            </div>

            {detail.actions?.length ? (
              <div className="placeholder-block">
                <strong>Safe actions, dry-runs, local execution, and blocked host previews</strong>
                <p>Read-only actions inspect runtime state, dry-runs stage plans, execute-local actions mutate only Studio-local control state, and preview-host actions now also map into a default-disabled slot handoff placeholder flow without touching host state.</p>
                <div className="action-toolbar">
                  {detail.actions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      className="action-button"
                      onClick={() => {
                        void runAction(action.id);
                      }}
                      disabled={Boolean(actionLoadingId)}
                      title={action.description}
                    >
                      {actionLoadingId === action.id ? `Running ${action.label}…` : action.label}
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
                <strong>Running action…</strong>
                <p>The selected runtime action is being executed; preview-host actions stay disabled and placeholder-only, while execute-local actions stay inside Studio without touching host runtime surfaces.</p>
              </div>
            ) : actionError ? (
              <div className="placeholder-block">
                <strong>Action failed</strong>
                <p>{actionError}</p>
              </div>
            ) : actionResult ? (
              <div className="detail-stack">
                <div className="placeholder-block">
                  <strong>{actionResult.title}</strong>
                  <p>{actionResult.summary}</p>
                  {actionResult.notices?.length ? (
                    <div className="detail-notice-list">
                      {actionResult.notices.map((notice) => (
                        <p key={notice}>{notice}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
                {actionResult.hostHandoff ? (
                  <HostTracePanel
                    hostExecutor={visibleBoundary.hostExecutor}
                    hostPreview={actionResult.hostPreview}
                    hostHandoff={actionResult.hostHandoff}
                    focusedSlotId={focusedSlotId}
                    onFocusedSlotChange={onFocusedSlotChange}
                    nested
                    eyebrow="Trace"
                    title="Dedicated Trace Panel"
                    summary="This panel keeps preview, slot, result, rollback, validator, audit correlation, and slot roster visible together for the selected simulated host handoff."
                  />
                ) : null}
                <div className="detail-grid">
                  {actionResult.sections.map((section) => (
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
              </div>
            ) : null}
          </div>
        ) : (
          <div className="placeholder-block">
            <strong>No runtime detail selected</strong>
            <p>Choose one of the runtime-backed Tools / MCP rows above to inspect a deeper read-only payload.</p>
          </div>
        )}
      </article>
    </section>
  );
}
