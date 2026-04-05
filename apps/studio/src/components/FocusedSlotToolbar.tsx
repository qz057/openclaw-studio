import type { StudioHostExecutorState } from "@openclaw/shared";
import { formatHostTraceIntent, resolveHostTraceFocus, resolveHostTraceTone } from "./host-trace-state";

interface FocusedSlotToolbarProps {
  hostExecutor: StudioHostExecutorState;
  focusedSlotId?: string | null;
  onFocusedSlotChange?: (slotId: string) => void;
  title?: string;
  summary?: string;
  nested?: boolean;
}

export function FocusedSlotToolbar({
  hostExecutor,
  focusedSlotId,
  onFocusedSlotChange,
  title = "Focused Slot Scope",
  summary = "Quick filters keep the simulated host bridge scope visible and let pages switch the active slot without leaving disabled placeholder mode.",
  nested = false
}: FocusedSlotToolbarProps) {
  const focus = resolveHostTraceFocus(hostExecutor, focusedSlotId);

  if (!focus) {
    return null;
  }

  const panelClassName = nested ? "focused-slot-toolbar focused-slot-toolbar--nested" : "surface card focused-slot-toolbar";

  return (
    <article className={panelClassName}>
      <div className="card-header card-header--stack">
        <div>
          <p className="eyebrow">Focused Slot</p>
          <h2>{title}</h2>
          <p>{summary}</p>
        </div>
        <div className="boundary-chip-group">
          <span className="tone-chip tone-chip--warning">simulated only</span>
          <span className="tone-chip tone-chip--neutral">persisted focus</span>
          <span className={`tone-chip tone-chip--${resolveHostTraceTone(focus.slot.primaryStatus)}`}>{focus.slot.primaryStatus}</span>
        </div>
      </div>

      <div className="focused-slot-summary-grid">
        <article className="focused-slot-summary-card">
          <span>Current slot</span>
          <strong>{focus.slot.label}</strong>
          <p>{focus.summary}</p>
        </article>
        <article className="focused-slot-summary-card">
          <span>Intent / handler</span>
          <strong>{formatHostTraceIntent(focus.slot.intent)}</strong>
          <p>
            {focus.slot.handlerLabel} · {focus.slot.handlerState}
          </p>
        </article>
        <article className="focused-slot-summary-card">
          <span>Validator / result</span>
          <strong>{focus.resultValue}</strong>
          <p>{focus.validationDetail}</p>
        </article>
        <article className="focused-slot-summary-card">
          <span>Rollback / audit</span>
          <strong>{focus.rollbackAuditValue}</strong>
          <p>{focus.rollbackAuditDetail}</p>
        </article>
      </div>

      <div className="focused-slot-controls">
        <div>
          <strong>Quick slot filters</strong>
          <p>Current page summaries, inspector, dock, and trace panels follow the selected slot.</p>
        </div>
        <div className="focus-pill-row" role="toolbar" aria-label="Quick slot filters">
          {hostExecutor.bridge.trace.slotRoster.map((entry) => {
            const active = entry.slotId === focus.slot.slotId;

            return (
              <button
                key={entry.slotId}
                type="button"
                className={active ? "focus-pill focus-pill--active" : "focus-pill"}
                onClick={() => {
                  onFocusedSlotChange?.(entry.slotId);
                }}
              >
                <span>{formatHostTraceIntent(entry.intent)}</span>
                <strong>{entry.label}</strong>
                <small>
                  {entry.primaryStatus} · rollback {entry.rollbackDisposition}
                </small>
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}
