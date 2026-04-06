import { selectStudioReleaseApprovalPipelineStage, type StudioReleaseApprovalPipeline } from "@openclaw/shared";

interface OperatorReviewBoardProps {
  pipeline: StudioReleaseApprovalPipeline;
  compact?: boolean;
  nested?: boolean;
  eyebrow?: string;
  title?: string;
  summary?: string;
}

function resolveStageTone(status: StudioReleaseApprovalPipeline["stages"][number]["status"]): "positive" | "neutral" | "warning" {
  switch (status) {
    case "ready":
      return "positive";
    case "in-review":
    case "planned":
      return "neutral";
    default:
      return "warning";
  }
}

function resolvePacketTone(
  status: StudioReleaseApprovalPipeline["stages"][number]["packet"]["status"]
): "positive" | "neutral" | "warning" {
  switch (status) {
    case "ready":
    case "sealed":
      return "positive";
    case "drafted":
    case "in-review":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveBatonTone(
  state: StudioReleaseApprovalPipeline["stages"][number]["handoff"]["batonState"]
): "positive" | "neutral" | "warning" {
  switch (state) {
    case "handoff-ready":
      return "positive";
    case "held":
    case "awaiting-ack":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveSealTone(
  state: StudioReleaseApprovalPipeline["stages"][number]["closeout"]["sealingState"]
): "positive" | "neutral" | "warning" {
  switch (state) {
    case "sealed":
      return "positive";
    case "open":
    case "pending-seal":
      return "neutral";
    default:
      return "warning";
  }
}

export function OperatorReviewBoard({
  pipeline,
  compact = false,
  nested = false,
  eyebrow = "Review",
  title,
  summary
}: OperatorReviewBoardProps) {
  const currentStage = selectStudioReleaseApprovalPipelineStage(pipeline) ?? pipeline.stages[0] ?? null;
  const boardNotes = compact ? pipeline.reviewBoard.reviewerNotes.slice(0, 2) : pipeline.reviewBoard.reviewerNotes;
  const currentPacket = currentStage?.packet ?? null;
  const currentHandoff = pipeline.decisionHandoff;
  const currentCloseout = pipeline.evidenceCloseout;
  const panelClassName = [
    nested ? "operator-review-board operator-review-board--nested" : "surface card operator-review-board",
    compact ? "operator-review-board--compact" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={panelClassName}>
      <div className="card-header card-header--stack">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title ?? pipeline.reviewBoard.title}</h2>
          <p>{summary ?? pipeline.summary}</p>
        </div>
        <div className="boundary-chip-group">
          <span className="tone-chip tone-chip--neutral">{pipeline.mode}</span>
          <span className="tone-chip tone-chip--warning">{pipeline.reviewBoard.posture}</span>
        </div>
      </div>

      <div className="operator-review-board__top-grid">
        <article className="windowing-summary-card windowing-summary-card--active">
          <span>Operator Review Board</span>
          <strong>{currentStage?.label ?? pipeline.reviewBoard.title}</strong>
          <p>{pipeline.reviewBoard.summary}</p>
          <div className="windowing-preview-list">
            <div className="windowing-preview-line">
              <span>Stage ownership</span>
              <strong>{pipeline.reviewBoard.activeOwner}</strong>
            </div>
            <div className="windowing-preview-line">
              <span>Current stage</span>
              <strong>{currentStage ? `${currentStage.status} / ${currentStage.owner}` : "Unavailable"}</strong>
            </div>
            {boardNotes.map((note) => (
              <div key={note.id} className="windowing-preview-line windowing-preview-line--stacked">
                <span>{note.label}</span>
                <strong>{note.value}</strong>
                <p>{note.detail}</p>
                {note.links?.length ? (
                  <div className="trace-note-links">
                    {note.links.map((link) => (
                      <span key={link.id} className="windowing-badge">
                        {link.label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </article>

        <article className="windowing-summary-card">
          <span>Active Review Packet</span>
          <strong>{currentPacket?.label ?? "No active packet"}</strong>
          <p>{currentPacket?.summary ?? "No active review packet is currently available."}</p>
          <div className="workflow-readiness-list">
            <div className={`workflow-readiness-line workflow-readiness-line--${resolvePacketTone(currentPacket?.status ?? "blocked")}`}>
              <span>Review packet</span>
              <strong>{currentPacket ? `${currentPacket.status} / ${currentPacket.owner}` : "Unavailable"}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Evidence count</span>
              <strong>{currentPacket?.evidence.length ?? 0} linked artifacts</strong>
            </div>
          </div>
          {!compact && currentPacket ? (
            <div className="windowing-preview-list">
              {currentPacket.evidence.map((artifact) => (
                <div key={artifact} className="windowing-preview-line windowing-preview-line--stacked">
                  <span>Linked artifact</span>
                  <strong>{artifact}</strong>
                </div>
              ))}
              {currentPacket.reviewerNotes.map((note) => (
                <div key={note.id} className="windowing-preview-line windowing-preview-line--stacked">
                  <span>{note.label}</span>
                  <strong>{note.value}</strong>
                  <p>{note.detail}</p>
                </div>
              ))}
            </div>
          ) : null}
        </article>

        <article className="windowing-summary-card">
          <span>Decision Handoff</span>
          <strong>{currentHandoff.label}</strong>
          <p>{currentHandoff.summary}</p>
          <div className="workflow-readiness-list">
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveBatonTone(currentHandoff.batonState)}`}>
              <span>Baton posture</span>
              <strong>{currentHandoff.batonState}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Ownership</span>
              <strong>
                {currentHandoff.sourceOwner} -&gt; {currentHandoff.targetOwner}
              </strong>
            </div>
          </div>
          {!compact && currentHandoff.pending.length > 0 ? (
            <div className="windowing-preview-list">
              {currentHandoff.pending.map((item) => (
                <div key={item} className="windowing-preview-line windowing-preview-line--stacked">
                  <span>Pending</span>
                  <strong>{item}</strong>
                </div>
              ))}
            </div>
          ) : null}
          {!compact && currentHandoff.reviewerNotes.length > 0 ? (
            <div className="windowing-preview-list">
              {currentHandoff.reviewerNotes.map((note) => (
                <div key={note.id} className="windowing-preview-line windowing-preview-line--stacked">
                  <span>{note.label}</span>
                  <strong>{note.value}</strong>
                  <p>{note.detail}</p>
                </div>
              ))}
            </div>
          ) : null}
        </article>

        <article className="windowing-summary-card">
          <span>Evidence Closeout</span>
          <strong>{currentCloseout.label}</strong>
          <p>{currentCloseout.summary}</p>
          <div className="workflow-readiness-list">
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveSealTone(currentCloseout.sealingState)}`}>
              <span>Evidence sealing</span>
              <strong>{currentCloseout.sealingState}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Closeout owner</span>
              <strong>{currentCloseout.owner}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Sealed / pending</span>
              <strong>
                {currentCloseout.sealedEvidence.length} / {currentCloseout.pendingEvidence.length}
              </strong>
            </div>
          </div>
          {!compact ? (
            <div className="windowing-preview-list">
              {currentCloseout.sealedEvidence.map((artifact) => (
                <div key={`sealed-${artifact}`} className="windowing-preview-line windowing-preview-line--stacked">
                  <span>Sealed evidence</span>
                  <strong>{artifact}</strong>
                </div>
              ))}
              {currentCloseout.pendingEvidence.map((artifact) => (
                <div key={`pending-${artifact}`} className="windowing-preview-line windowing-preview-line--stacked">
                  <span>Pending evidence</span>
                  <strong>{artifact}</strong>
                </div>
              ))}
              {currentCloseout.reviewerNotes.map((note) => (
                <div key={note.id} className="windowing-preview-line windowing-preview-line--stacked">
                  <span>{note.label}</span>
                  <strong>{note.value}</strong>
                  <p>{note.detail}</p>
                </div>
              ))}
            </div>
          ) : null}
        </article>
      </div>

      <div className="panel-title-row">
        <h3>Stage Ownership</h3>
        <span>{pipeline.stages.length} stages</span>
      </div>

      <div className="operator-review-board__stage-grid">
        {pipeline.stages.map((stage) => (
          <article
            key={stage.id}
            className={`workflow-step-card workflow-step-card--${resolveStageTone(stage.status)}${
              stage.id === currentStage?.id ? " workflow-step-card--active" : ""
            }`}
          >
            <div className="workflow-step-card__meta">
              <span>{stage.label}</span>
              <strong>
                {stage.status} / {stage.owner}
              </strong>
            </div>
            <h3>{stage.summary}</h3>
            <div className="workflow-readiness-list">
              <div className={`workflow-readiness-line workflow-readiness-line--${resolvePacketTone(stage.packet.status)}`}>
                <span>Review packet</span>
                <strong>{stage.packet.status}</strong>
              </div>
              <div className={`workflow-readiness-line workflow-readiness-line--${resolveBatonTone(stage.handoff.batonState)}`}>
                <span>Baton posture</span>
                <strong>{stage.handoff.batonState}</strong>
              </div>
              <div className={`workflow-readiness-line workflow-readiness-line--${resolveSealTone(stage.closeout.sealingState)}`}>
                <span>Evidence closeout</span>
                <strong>{stage.closeout.sealingState}</strong>
              </div>
            </div>
            {!compact ? (
              <div className="windowing-preview-list">
                <div className="windowing-preview-line">
                  <span>Packet owner</span>
                  <strong>{stage.packet.owner}</strong>
                </div>
                <div className="windowing-preview-line">
                  <span>Decision handoff</span>
                  <strong>
                    {stage.handoff.sourceOwner} -&gt; {stage.handoff.targetOwner}
                  </strong>
                </div>
                <div className="windowing-preview-line">
                  <span>Evidence sealing</span>
                  <strong>
                    {stage.closeout.sealedEvidence.length} sealed / {stage.closeout.pendingEvidence.length} pending
                  </strong>
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </article>
  );
}
