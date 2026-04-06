import {
  selectStudioReleaseApprovalPipelineStage,
  selectStudioReleaseCloseoutWindow,
  selectStudioReleaseEscalationWindow,
  selectStudioReleaseReviewerQueue,
  type StudioReleaseAcknowledgementState,
  type StudioReleaseApprovalPipeline,
  type StudioReleaseCloseoutWindowState,
  type StudioReleaseEscalationWindowState,
  type StudioReleaseReviewerQueueStatus
} from "@openclaw/shared";

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

function resolveAcknowledgementTone(state: StudioReleaseAcknowledgementState): "positive" | "neutral" | "warning" {
  switch (state) {
    case "acknowledged":
      return "positive";
    case "pending":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveReviewerQueueTone(status: StudioReleaseReviewerQueueStatus): "positive" | "neutral" | "warning" {
  switch (status) {
    case "closed":
      return "positive";
    case "active":
    case "handoff-ready":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveEscalationTone(state: StudioReleaseEscalationWindowState): "positive" | "neutral" | "warning" {
  switch (state) {
    case "watch":
      return "positive";
    case "open":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveCloseoutWindowTone(state: StudioReleaseCloseoutWindowState): "positive" | "neutral" | "warning" {
  switch (state) {
    case "ready-to-seal":
      return "positive";
    case "scheduled":
    case "open":
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
  const currentReviewerQueue = selectStudioReleaseReviewerQueue(pipeline, currentStage ?? undefined) ?? pipeline.reviewerQueues[0] ?? null;
  const currentEscalationWindow =
    selectStudioReleaseEscalationWindow(pipeline, currentStage ?? undefined) ?? pipeline.escalationWindows[0] ?? null;
  const currentCloseoutWindow = selectStudioReleaseCloseoutWindow(pipeline, currentStage ?? undefined) ?? pipeline.closeoutWindows[0] ?? null;
  const activeQueueEntry =
    currentReviewerQueue?.entries.find((entry) => entry.id === currentReviewerQueue.activeEntryId) ?? currentReviewerQueue?.entries[0] ?? null;
  const boardNotes = compact ? pipeline.reviewBoard.reviewerNotes.slice(0, 3) : pipeline.reviewBoard.reviewerNotes;
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
          <span className={`tone-chip tone-chip--${resolveAcknowledgementTone(pipeline.reviewBoard.activeAcknowledgementState)}`}>
            ack {pipeline.reviewBoard.activeAcknowledgementState}
          </span>
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
            <div className="windowing-preview-line">
              <span>Reviewer queue</span>
              <strong>{currentReviewerQueue ? `${currentReviewerQueue.label} / ${currentReviewerQueue.status}` : "Unavailable"}</strong>
            </div>
            <div className="windowing-preview-line">
              <span>Acknowledgement</span>
              <strong>{pipeline.reviewBoard.activeAcknowledgementState}</strong>
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
          <span>Reviewer Queue</span>
          <strong>{currentReviewerQueue?.label ?? "No active queue"}</strong>
          <p>{currentReviewerQueue?.summary ?? "No reviewer queue is currently active."}</p>
          <div className="workflow-readiness-list">
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveReviewerQueueTone(currentReviewerQueue?.status ?? "escalated")}`}>
              <span>Queue posture</span>
              <strong>{currentReviewerQueue ? `${currentReviewerQueue.status} / ${currentReviewerQueue.owner}` : "Unavailable"}</strong>
            </div>
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveAcknowledgementTone(currentReviewerQueue?.acknowledgementState ?? "blocked")}`}>
              <span>Acknowledgement</span>
              <strong>{currentReviewerQueue?.acknowledgementState ?? "Unavailable"}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Active entry</span>
              <strong>{activeQueueEntry ? `${activeQueueEntry.owner} / ${activeQueueEntry.status}` : "Unavailable"}</strong>
            </div>
          </div>
          {!compact && currentReviewerQueue ? (
            <div className="windowing-preview-list">
              {currentReviewerQueue.entries.map((entry) => (
                <div key={entry.id} className="windowing-preview-line windowing-preview-line--stacked">
                  <span>{entry.label}</span>
                  <strong>
                    {entry.owner} · {entry.status} · ack {entry.acknowledgementState}
                  </strong>
                  <p>{entry.summary}</p>
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
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveAcknowledgementTone(currentHandoff.acknowledgementState)}`}>
              <span>Acknowledgement</span>
              <strong>{currentHandoff.acknowledgementState}</strong>
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
          <span>Escalation Window</span>
          <strong>{currentEscalationWindow?.label ?? "No escalation window"}</strong>
          <p>{currentEscalationWindow?.summary ?? "No escalation window is currently declared."}</p>
          <div className="workflow-readiness-list">
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveEscalationTone(currentEscalationWindow?.state ?? "blocked")}`}>
              <span>Escalation state</span>
              <strong>{currentEscalationWindow?.state ?? "Unavailable"}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Deadline</span>
              <strong>{currentEscalationWindow?.deadlineLabel ?? "Unavailable"}</strong>
            </div>
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveAcknowledgementTone(currentEscalationWindow?.acknowledgementState ?? "blocked")}`}>
              <span>Acknowledgement</span>
              <strong>{currentEscalationWindow?.acknowledgementState ?? "Unavailable"}</strong>
            </div>
          </div>
          {!compact && currentEscalationWindow ? (
            <div className="windowing-preview-list">
              <div className="windowing-preview-line windowing-preview-line--stacked">
                <span>Trigger</span>
                <strong>{currentEscalationWindow.trigger}</strong>
              </div>
              {currentEscalationWindow.pending.map((item) => (
                <div key={item} className="windowing-preview-line windowing-preview-line--stacked">
                  <span>Pending</span>
                  <strong>{item}</strong>
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
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveAcknowledgementTone(currentCloseout.acknowledgementState)}`}>
              <span>Acknowledgement</span>
              <strong>{currentCloseout.acknowledgementState}</strong>
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

        <article className="windowing-summary-card">
          <span>Closeout Window</span>
          <strong>{currentCloseoutWindow?.label ?? "No closeout window"}</strong>
          <p>{currentCloseoutWindow?.summary ?? "No closeout window is currently declared."}</p>
          <div className="workflow-readiness-list">
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveCloseoutWindowTone(currentCloseoutWindow?.state ?? "blocked")}`}>
              <span>Window state</span>
              <strong>{currentCloseoutWindow?.state ?? "Unavailable"}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Deadline</span>
              <strong>{currentCloseoutWindow?.deadlineLabel ?? "Unavailable"}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Sealed / pending</span>
              <strong>
                {currentCloseoutWindow ? `${currentCloseoutWindow.sealedEvidence.length} / ${currentCloseoutWindow.pendingEvidence.length}` : "Unavailable"}
              </strong>
            </div>
          </div>
          {!compact && currentCloseoutWindow ? (
            <div className="windowing-preview-list">
              {currentCloseoutWindow.reviewerNotes.map((note) => (
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
        {pipeline.stages.map((stage) => {
          const stageQueue = selectStudioReleaseReviewerQueue(pipeline, stage);
          const stageEscalationWindow = selectStudioReleaseEscalationWindow(pipeline, stage);
          const stageCloseoutWindow = selectStudioReleaseCloseoutWindow(pipeline, stage);

          return (
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
                <div className={`workflow-readiness-line workflow-readiness-line--${resolveReviewerQueueTone(stageQueue?.status ?? "escalated")}`}>
                  <span>Reviewer queue</span>
                  <strong>{stageQueue ? `${stageQueue.status} / ${stageQueue.owner}` : "Unavailable"}</strong>
                </div>
                <div className={`workflow-readiness-line workflow-readiness-line--${resolveAcknowledgementTone(stage.handoff.acknowledgementState)}`}>
                  <span>Acknowledgement</span>
                  <strong>{stage.handoff.acknowledgementState}</strong>
                </div>
                <div className={`workflow-readiness-line workflow-readiness-line--${resolveBatonTone(stage.handoff.batonState)}`}>
                  <span>Baton posture</span>
                  <strong>{stage.handoff.batonState}</strong>
                </div>
                <div className={`workflow-readiness-line workflow-readiness-line--${resolveEscalationTone(stageEscalationWindow?.state ?? "blocked")}`}>
                  <span>Escalation</span>
                  <strong>{stageEscalationWindow?.state ?? "Unavailable"}</strong>
                </div>
                <div className={`workflow-readiness-line workflow-readiness-line--${resolveCloseoutWindowTone(stageCloseoutWindow?.state ?? "blocked")}`}>
                  <span>Closeout window</span>
                  <strong>{stageCloseoutWindow?.state ?? "Unavailable"}</strong>
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
                    <span>Queue ownership</span>
                    <strong>{stageQueue ? `${stageQueue.label} / ${stageQueue.sharedStateLaneId}` : "Unavailable"}</strong>
                  </div>
                  <div className="windowing-preview-line">
                    <span>Escalation window</span>
                    <strong>{stageEscalationWindow ? `${stageEscalationWindow.label} / ${stageEscalationWindow.deadlineLabel}` : "Unavailable"}</strong>
                  </div>
                  <div className="windowing-preview-line">
                    <span>Decision handoff</span>
                    <strong>
                      {stage.handoff.sourceOwner} -&gt; {stage.handoff.targetOwner}
                    </strong>
                  </div>
                  <div className="windowing-preview-line">
                    <span>Closeout window</span>
                    <strong>{stageCloseoutWindow ? `${stageCloseoutWindow.label} / ${stageCloseoutWindow.deadlineLabel}` : "Unavailable"}</strong>
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
          );
        })}
      </div>
    </article>
  );
}
