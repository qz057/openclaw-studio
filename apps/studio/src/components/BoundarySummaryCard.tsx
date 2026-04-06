import {
  selectStudioReleaseApprovalPipelineStage,
  selectStudioReleaseCloseoutWindow,
  selectStudioReleaseEscalationWindow,
  selectStudioReleaseReviewerQueue,
  type StudioBoundaryLayer,
  type StudioBoundarySummary
} from "@openclaw/shared";

interface BoundarySummaryCardProps {
  boundary: StudioBoundarySummary;
  compact?: boolean;
  nested?: boolean;
  eyebrow?: string;
}

function formatBoundaryLayerLabel(layer: StudioBoundaryLayer): string {
  switch (layer) {
    case "local-only":
      return "Local-only";
    case "preview-host":
      return "Preview-host";
    case "withheld":
      return "Withheld";
    default:
      return "Future executor";
  }
}

function formatHostState(hostState: StudioBoundarySummary["hostState"]): string {
  return hostState === "future-executor" ? "Future executor" : "Withheld";
}

function resolveStateTone(value: string): "positive" | "neutral" | "warning" {
  switch (value) {
    case "active":
    case "ready":
    case "met":
      return "positive";
    case "available":
    case "partial":
    case "planned":
      return "neutral";
    default:
      return "warning";
  }
}

export function BoundarySummaryCard({
  boundary,
  compact = false,
  nested = false,
  eyebrow = "Boundary"
}: BoundarySummaryCardProps) {
  const cardClassName = [
    nested ? "boundary-card boundary-card--nested" : "surface card boundary-card",
    compact ? "boundary-card--compact" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const blockedReasons = compact ? boundary.blockedReasons.slice(0, 3) : boundary.blockedReasons;
  const requiredPreconditions = compact ? boundary.requiredPreconditions.slice(0, 3) : boundary.requiredPreconditions;
  const simulatedOutcomeStatuses = Array.from(
    new Set(boundary.hostExecutor.bridge.slotHandlers.flatMap((handler) => handler.simulatedOutcomes.map((outcome) => outcome.status)))
  );
  const currentReleaseStage = selectStudioReleaseApprovalPipelineStage(boundary.hostExecutor.releaseApprovalPipeline);
  const currentReviewerQueue = selectStudioReleaseReviewerQueue(boundary.hostExecutor.releaseApprovalPipeline, currentReleaseStage);
  const currentDecisionHandoff = boundary.hostExecutor.releaseApprovalPipeline.decisionHandoff;
  const currentEscalationWindow = selectStudioReleaseEscalationWindow(boundary.hostExecutor.releaseApprovalPipeline, currentReleaseStage);
  const currentEvidenceCloseout = boundary.hostExecutor.releaseApprovalPipeline.evidenceCloseout;
  const currentCloseoutWindow = selectStudioReleaseCloseoutWindow(boundary.hostExecutor.releaseApprovalPipeline, currentReleaseStage);

  return (
    <article className={cardClassName}>
      <div className="card-header card-header--stack boundary-card__header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{boundary.title}</h2>
          <p>{boundary.summary}</p>
        </div>
        <div className="boundary-chip-group">
          <span className={`tone-chip tone-chip--${boundary.tone}`}>{formatBoundaryLayerLabel(boundary.currentLayer)}</span>
          <span className="tone-chip tone-chip--warning">{formatHostState(boundary.hostState)}</span>
        </div>
      </div>

      <div className="boundary-stat-row">
        <article className="boundary-stat">
          <span>Policy</span>
          <strong>{boundary.policy.posture}</strong>
        </article>
        <article className="boundary-stat">
          <span>Approval</span>
          <strong>{boundary.policy.approvalMode}</strong>
        </article>
        <article className="boundary-stat">
          <span>Next layer</span>
          <strong>{formatBoundaryLayerLabel(boundary.nextLayer)}</strong>
        </article>
      </div>

      <div className="boundary-ladder">
        {boundary.progression.map((step) => (
          <article key={step.id} className="boundary-step">
            <div className="row-heading">
              <strong>{step.label}</strong>
              <span className={`tone-chip tone-chip--${resolveStateTone(step.status)}`}>{step.status}</span>
            </div>
            <p>{step.detail}</p>
          </article>
        ))}
      </div>

      <div className={`boundary-grid${compact ? " boundary-grid--compact" : ""}`}>
        <div className="placeholder-block">
          <strong>Policy summary</strong>
          <p>{boundary.policy.detail}</p>
          <ul className="detail-lines">
            {boundary.policy.protectedSurfaces.map((surface) => (
              <li key={surface}>{surface}</li>
            ))}
          </ul>
        </div>

        <div className="placeholder-block">
          <strong>Capability state</strong>
          <ul className="detail-lines">
            {boundary.capabilities.map((capability) => (
              <li key={capability.id}>
                {capability.label} · {capability.state} · {capability.detail}
              </li>
            ))}
          </ul>
        </div>

        <div className="placeholder-block">
          <strong>Blocked reasons</strong>
          <ul className="detail-lines">
            {blockedReasons.map((reason) => (
              <li key={`${reason.code}-${reason.label}`}>
                {reason.label} · {formatBoundaryLayerLabel(reason.layer)} · {reason.detail}
              </li>
            ))}
          </ul>
        </div>

        <div className="placeholder-block">
          <strong>Required before next layer</strong>
          <ul className="detail-lines">
            {requiredPreconditions.map((precondition) => (
              <li key={precondition.id}>
                {precondition.label} · {precondition.state} · {precondition.detail}
              </li>
            ))}
          </ul>
        </div>

        {!compact ? (
          <div className="placeholder-block">
            <strong>Withheld execution plan</strong>
            <ul className="detail-lines">
              {boundary.withheldExecutionPlan.map((step) => (
                <li key={step.id}>
                  {step.label} · {step.state} · {step.detail}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!compact ? (
          <div className="placeholder-block">
            <strong>Future executor slots</strong>
            <ul className="detail-lines">
              {boundary.futureExecutorSlots.map((slot) => (
                <li key={slot.id}>
                  {slot.label} · {slot.state} · {slot.detail}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="placeholder-block">
          <strong>Host executor / bridge</strong>
          <ul className="detail-lines">
            <li>
              mode · {boundary.hostExecutor.mode} · {boundary.hostExecutor.transport}
            </li>
            <li>
              contract · {boundary.hostExecutor.handoffContractVersion} · default {boundary.hostExecutor.defaultEnabled ? "enabled" : "disabled"}
            </li>
            <li>
              intents · {boundary.hostExecutor.intents.length} · slots · {boundary.hostExecutor.mutationSlots.length}
            </li>
            <li>
              bridge · {boundary.hostExecutor.bridge.mode} · handoff {boundary.hostExecutor.bridge.previewHandoff}
            </li>
            <li>
              validators · {boundary.hostExecutor.bridge.validators.length} · handlers · {boundary.hostExecutor.bridge.slotHandlers.length}
            </li>
            <li>
              lifecycle stages · {boundary.hostExecutor.lifecycle.length} · failure cases · {boundary.hostExecutor.failureTaxonomy.length}
            </li>
            <li>
              operator board · {boundary.hostExecutor.releaseApprovalPipeline.mode} · {boundary.hostExecutor.releaseApprovalPipeline.stages.length} stages
            </li>
            <li>
              reviewer queues · {boundary.hostExecutor.releaseApprovalPipeline.reviewerQueues.length} · escalation windows ·{" "}
              {boundary.hostExecutor.releaseApprovalPipeline.escalationWindows.length}
            </li>
            <li>
              closeout windows · {boundary.hostExecutor.releaseApprovalPipeline.closeoutWindows.length} · active ack ·{" "}
              {boundary.hostExecutor.releaseApprovalPipeline.reviewBoard.activeAcknowledgementState}
            </li>
            <li>
              simulated outcomes · {simulatedOutcomeStatuses.join(" / ")}
            </li>
            <li>
              {"timeline / trace panel · preview -> slot -> result -> rollback"}
            </li>
          </ul>
        </div>

        <div className="placeholder-block">
          <strong>Approval / audit / rollback</strong>
          <ul className="detail-lines">
            <li>
              approval · {boundary.hostExecutor.approval.status} · {boundary.hostExecutor.approval.mode}
            </li>
            <li>
              audit · {boundary.hostExecutor.audit.status} · retained {boundary.hostExecutor.audit.retainedStages.join(" / ")}
            </li>
            <li>
              rollback · {boundary.hostExecutor.rollback.status} · {boundary.hostExecutor.rollback.stages.length} stages
            </li>
            <li>
              pipeline · {currentReleaseStage?.label ?? "Unavailable"} · {currentReleaseStage?.status ?? "unknown"}
            </li>
            <li>
              reviewer queue · {currentReviewerQueue?.label ?? "Unavailable"} · {currentReviewerQueue?.acknowledgementState ?? "unknown"}
            </li>
            <li>
              handoff · {currentDecisionHandoff.batonState} · {currentDecisionHandoff.sourceOwner} -&gt; {currentDecisionHandoff.targetOwner}
            </li>
            <li>
              escalation window · {currentEscalationWindow?.state ?? "unknown"} · {currentEscalationWindow?.deadlineLabel ?? "Unavailable"}
            </li>
            <li>
              closeout · {currentEvidenceCloseout.sealingState} · {currentEvidenceCloseout.sealedEvidence.length} sealed / {currentEvidenceCloseout.pendingEvidence.length} pending
            </li>
            <li>
              closeout window · {currentCloseoutWindow?.state ?? "unknown"} · {currentCloseoutWindow?.deadlineLabel ?? "Unavailable"}
            </li>
            <li>
              blockers · {boundary.hostExecutor.releaseApprovalPipeline.blockedBy.length} · review-only release decision remains blocked
            </li>
          </ul>
        </div>

        {!compact ? (
          <div className="placeholder-block">
            <strong>Mutation slot contract</strong>
            <ul className="detail-lines">
              {boundary.hostExecutor.mutationSlots.map((slot) => (
                <li key={slot.id}>
                  {slot.label} · {slot.state} · {slot.channel} · {slot.handoff.payloadType} → {slot.handoff.resultType}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
}
