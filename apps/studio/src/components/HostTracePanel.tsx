import type {
  StudioHostExecutorState,
  StudioHostMutationPreview,
  StudioHostPreviewHandoff,
  StudioHostPreviewTraceStatus
} from "@openclaw/shared";
import { resolveHostTraceFocus } from "./host-trace-state";

interface HostTracePanelProps {
  hostExecutor: StudioHostExecutorState;
  hostPreview?: StudioHostMutationPreview | null;
  hostHandoff?: StudioHostPreviewHandoff | null;
  focusedSlotId?: string | null;
  onFocusedSlotChange?: (slotId: string) => void;
  compact?: boolean;
  nested?: boolean;
  eyebrow?: string;
  title?: string;
  summary?: string;
}

function resolveTraceTone(status: string): "positive" | "neutral" | "warning" {
  switch (status) {
    case "not-needed":
    case "valid":
    case "registered":
    case "linked":
      return "positive";
    case "mapped":
    case "accepted":
    case "available":
    case "required":
    case "partial-apply":
    case "rollback-required":
      return "neutral";
    default:
      return "warning";
  }
}

export function HostTracePanel({
  hostExecutor,
  hostPreview,
  hostHandoff,
  focusedSlotId,
  onFocusedSlotChange,
  compact = false,
  nested = false,
  eyebrow = "Trace",
  title,
  summary
}: HostTracePanelProps) {
  const slotRoster = hostExecutor.bridge.trace.slotRoster;
  const focus = resolveHostTraceFocus(hostExecutor, focusedSlotId, hostHandoff, hostPreview);

  if (!focus) {
    return null;
  }

  const panelClassName = [
    nested ? "host-trace-panel host-trace-panel--nested" : "surface card host-trace-panel",
    compact ? "host-trace-panel--compact" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={panelClassName}>
      <div className="card-header card-header--stack">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title ?? "Slot-state timeline"}</h2>
          <p>
            {summary ??
              "Preview, slot, result, rollback, validator, and disposition state stay grouped here as a simulated-only host bridge panel."}
          </p>
        </div>
        <div className="boundary-chip-group">
          <span className="tone-chip tone-chip--warning">simulated only</span>
          <span className="tone-chip tone-chip--neutral">{focus.usesHandoff ? "focused handoff" : "slot roster focus"}</span>
        </div>
      </div>

      <div className="trace-slot-roster">
        {slotRoster.map((entry) => {
          const active = entry.slotId === focus.slot.slotId;

          return (
            <button
              key={entry.slotId}
              type="button"
              className={active ? "trace-slot-card trace-slot-button trace-slot-button--active" : "trace-slot-card trace-slot-button"}
              onClick={() => {
                onFocusedSlotChange?.(entry.slotId);
              }}
            >
              <span>{entry.intent}</span>
              <strong>{entry.label}</strong>
              <p>{entry.summary}</p>
              <div className="trace-slot-meta">
                <span>{active ? "focused" : "available"}</span>
                <span>{entry.primaryStatus}</span>
                <span>rollback {entry.rollbackDisposition}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="trace-state-grid">
        <article className="trace-state-card">
          <span>Preview</span>
          <strong>{focus.previewLabel}</strong>
          <p>{focus.previewSummary}</p>
        </article>
        <article className="trace-state-card">
          <span>Current slot</span>
          <strong>{focus.slot.label}</strong>
          <p>
            {focus.slot.slotId} · {focus.slot.channel}
          </p>
        </article>
        <article className="trace-state-card">
          <span>Handler</span>
          <strong>{focus.slot.handlerState}</strong>
          <p>{focus.slot.handlerLabel}</p>
        </article>
        <article className="trace-state-card">
          <span>Validator</span>
          <strong>{focus.validationValue}</strong>
          <p>{focus.validationDetail}</p>
        </article>
        <article className="trace-state-card">
          <span>Result</span>
          <strong>{focus.resultValue}</strong>
          <p>{focus.resultDetail}</p>
        </article>
        <article className="trace-state-card">
          <span>Rollback / audit</span>
          <strong>{focus.rollbackAuditValue}</strong>
          <p>{focus.rollbackAuditDetail}</p>
        </article>
      </div>

      <div className="trace-step-grid">
        {focus.trace.map((step, index) => (
          <article key={step.id} className="trace-step-card trace-step-card--timeline">
            <div className="trace-step-meta">
              <span>
                {index + 1}. {step.phase}
              </span>
              <span className={`tone-chip tone-chip--${resolveTraceTone(step.status)}`}>{step.status}</span>
            </div>
            <strong>{step.label}</strong>
            <p>{step.summary}</p>
          </article>
        ))}
      </div>
    </article>
  );
}
