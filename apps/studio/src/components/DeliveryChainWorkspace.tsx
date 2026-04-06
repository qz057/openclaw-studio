import { useEffect, useState } from "react";
import {
  selectStudioReleaseApprovalPipelineStage,
  selectStudioReleaseCloseoutWindow,
  selectStudioReleaseDeliveryChainStage,
  selectStudioReleaseEscalationWindow,
  selectStudioReleaseReviewerQueue,
  type StudioReleaseAcknowledgementState,
  type StudioReleaseApprovalPipeline,
  type StudioReleaseCloseoutWindowState,
  type StudioReleaseEscalationWindowState,
  type StudioReleaseReviewerQueueStatus,
  type StudioShellState
} from "@openclaw/shared";

interface DeliveryChainWorkspaceProps {
  pipeline: StudioReleaseApprovalPipeline;
  windowing?: StudioShellState["windowing"];
  compact?: boolean;
  nested?: boolean;
  eyebrow?: string;
  title?: string;
  summary?: string;
}

type Tone = "positive" | "neutral" | "warning";

function resolveStageTone(status: StudioReleaseApprovalPipeline["stages"][number]["status"]): Tone {
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

function resolveAcknowledgementTone(state: StudioReleaseAcknowledgementState): Tone {
  switch (state) {
    case "acknowledged":
      return "positive";
    case "pending":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveReviewerQueueTone(status: StudioReleaseReviewerQueueStatus): Tone {
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

function resolveEscalationTone(state: StudioReleaseEscalationWindowState): Tone {
  switch (state) {
    case "watch":
      return "positive";
    case "open":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveCloseoutWindowTone(state: StudioReleaseCloseoutWindowState): Tone {
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

function resolveBatonTone(state: StudioReleaseApprovalPipeline["stages"][number]["handoff"]["batonState"]): Tone {
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

function resolveSealTone(state: StudioReleaseApprovalPipeline["stages"][number]["closeout"]["sealingState"]): Tone {
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

function formatReviewPostureRelationship(
  relationship: StudioShellState["windowing"]["observability"]["mappings"][number]["relationship"]
): string {
  switch (relationship) {
    case "owns-current-posture":
      return "Owns current posture";
    case "mirrors-current-posture":
      return "Mirrors current posture";
    case "staged-for-handoff":
      return "Staged for handoff";
    case "blocked-upstream":
      return "Blocked upstream";
    case "escalation-shadow":
      return "Escalation shadow";
    default:
      return "Blocked decision gate";
  }
}

function resolveArtifactCoverage(
  artifact: string,
  stage: StudioReleaseApprovalPipeline["stages"][number] | null,
  closeoutWindow: StudioReleaseApprovalPipeline["closeoutWindows"][number] | null
) {
  const badges: string[] = [];

  if (stage?.evidence.includes(artifact)) {
    badges.push("stage evidence");
  }

  if (stage?.packet.evidence.includes(artifact)) {
    badges.push("review packet");
  }

  if (stage?.closeout.sealedEvidence.includes(artifact)) {
    badges.push("sealed closeout");
  }

  if (stage?.closeout.pendingEvidence.includes(artifact)) {
    badges.push("pending closeout");
  }

  if (closeoutWindow?.sealedEvidence.includes(artifact)) {
    badges.push("window sealed");
  }

  if (closeoutWindow?.pendingEvidence.includes(artifact)) {
    badges.push("window pending");
  }

  if (badges.includes("sealed closeout") || badges.includes("window sealed")) {
    return {
      label: "sealed evidence",
      detail: badges.join(" / "),
      tone: "positive" as Tone,
      badges
    };
  }

  if (badges.includes("pending closeout") || badges.includes("window pending")) {
    return {
      label: "pending closeout",
      detail: badges.join(" / "),
      tone: "warning" as Tone,
      badges
    };
  }

  if (badges.length > 0) {
    return {
      label: "linked review artifact",
      detail: badges.join(" / "),
      tone: "neutral" as Tone,
      badges
    };
  }

  return {
    label: "delivery reference",
    detail: "Grouped in the delivery chain so the stage can be reviewed end-to-end even when the current packet does not carry it directly.",
    tone: "neutral" as Tone,
    badges: ["delivery reference"]
  };
}

export function DeliveryChainWorkspace({
  pipeline,
  windowing,
  compact = false,
  nested = false,
  eyebrow = "Delivery",
  title,
  summary
}: DeliveryChainWorkspaceProps) {
  const currentPipelineStage = selectStudioReleaseApprovalPipelineStage(pipeline) ?? pipeline.stages[0] ?? null;
  const currentDeliveryStage = selectStudioReleaseDeliveryChainStage(pipeline, currentPipelineStage ?? undefined) ?? pipeline.deliveryChain.stages[0] ?? null;
  const [selectedStageId, setSelectedStageId] = useState<string>(currentDeliveryStage?.id ?? pipeline.deliveryChain.currentStageId);
  const [selectedArtifactGroupId, setSelectedArtifactGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!pipeline.deliveryChain.stages.some((stage) => stage.id === selectedStageId)) {
      setSelectedStageId(currentDeliveryStage?.id ?? pipeline.deliveryChain.currentStageId);
    }
  }, [currentDeliveryStage?.id, pipeline.deliveryChain.currentStageId, pipeline.deliveryChain.stages, selectedStageId]);

  const selectedDeliveryStage =
    selectStudioReleaseDeliveryChainStage(pipeline, selectedStageId) ??
    selectStudioReleaseDeliveryChainStage(pipeline, currentPipelineStage ?? undefined) ??
    pipeline.deliveryChain.stages[0] ??
    null;
  const selectedPipelineStage =
    pipeline.stages.find((stage) => stage.id === selectedDeliveryStage?.pipelineStageId) ??
    pipeline.stages.find((stage) => stage.deliveryChainStageId === selectedDeliveryStage?.id) ??
    currentPipelineStage;

  useEffect(() => {
    if (!selectedDeliveryStage) {
      if (selectedArtifactGroupId !== null) {
        setSelectedArtifactGroupId(null);
      }

      return;
    }

    if (!selectedArtifactGroupId || !selectedDeliveryStage.artifactGroups.some((group) => group.id === selectedArtifactGroupId)) {
      setSelectedArtifactGroupId(selectedDeliveryStage.artifactGroups[0]?.id ?? null);
    }
  }, [selectedArtifactGroupId, selectedDeliveryStage]);

  const selectedReviewerQueue = selectedPipelineStage ? selectStudioReleaseReviewerQueue(pipeline, selectedPipelineStage) ?? null : null;
  const selectedEscalationWindow = selectedPipelineStage ? selectStudioReleaseEscalationWindow(pipeline, selectedPipelineStage) ?? null : null;
  const selectedCloseoutWindow = selectedPipelineStage ? selectStudioReleaseCloseoutWindow(pipeline, selectedPipelineStage) ?? null : null;
  const selectedArtifactGroup =
    selectedDeliveryStage?.artifactGroups.find((group) => group.id === selectedArtifactGroupId) ??
    selectedDeliveryStage?.artifactGroups[0] ??
    null;
  const stageMappings =
    windowing?.observability.mappings.filter((mapping) => mapping.reviewPosture.deliveryChainStageId === selectedDeliveryStage?.id) ?? [];
  const activeStageMapping =
    stageMappings.find((mapping) => mapping.id === windowing?.observability.activeMappingId) ?? stageMappings[0] ?? null;
  const upstreamStages = (selectedDeliveryStage?.upstreamStageIds ?? [])
    .map((stageId) => selectStudioReleaseDeliveryChainStage(pipeline, stageId))
    .filter((stage): stage is NonNullable<typeof stage> => Boolean(stage));
  const downstreamStages = (selectedDeliveryStage?.downstreamStageIds ?? [])
    .map((stageId) => selectStudioReleaseDeliveryChainStage(pipeline, stageId))
    .filter((stage): stage is NonNullable<typeof stage> => Boolean(stage));
  const activeQueueEntry =
    selectedReviewerQueue?.entries.find((entry) => entry.id === selectedReviewerQueue.activeEntryId) ?? selectedReviewerQueue?.entries[0] ?? null;
  const publishStage = selectStudioReleaseDeliveryChainStage(pipeline, "delivery-chain-publish-decision") ?? null;
  const rollbackStage = selectStudioReleaseDeliveryChainStage(pipeline, "delivery-chain-rollback-readiness") ?? null;
  const panelClassName = [
    nested ? "delivery-chain-workspace delivery-chain-workspace--nested" : "surface card delivery-chain-workspace",
    compact ? "delivery-chain-workspace--compact" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={panelClassName}>
      <div className="card-header card-header--stack">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title ?? "Delivery-chain Workspace"}</h2>
          <p>
            {summary ??
              "Stage Explorer ties the operator board, delivery stage, review artifacts, promotion/publish/rollback flow, blockers, handoff posture, and observability mapping into one local-only review surface."}
          </p>
        </div>
        <div className="windowing-card__meta">
          <span className="windowing-badge windowing-badge--active">{selectedDeliveryStage?.label ?? "No delivery stage"}</span>
          <span className="windowing-badge">
            {selectedDeliveryStage ? `${selectedDeliveryStage.phase} / ${selectedDeliveryStage.status}` : "No delivery posture"}
          </span>
          <span className="windowing-badge">
            {selectedReviewerQueue ? `${selectedReviewerQueue.label} / ack ${selectedReviewerQueue.acknowledgementState}` : "No reviewer queue"}
          </span>
          <span className="windowing-badge">
            {activeStageMapping ? `${formatReviewPostureRelationship(activeStageMapping.relationship)} / ${activeStageMapping.routeId}` : "No observability mapping"}
          </span>
        </div>
      </div>

      <div className="delivery-chain-workspace__metrics">
        <div className="foundation-pill">
          <span>Current stage</span>
          <strong>{currentDeliveryStage?.label ?? "Unavailable"}</strong>
        </div>
        <div className="foundation-pill">
          <span>Selected owner</span>
          <strong>{selectedDeliveryStage?.owner ?? "Unavailable"}</strong>
        </div>
        <div className="foundation-pill">
          <span>Artifact groups</span>
          <strong>{selectedDeliveryStage?.artifactGroups.length ?? 0} groups</strong>
        </div>
        <div className="foundation-pill">
          <span>Observability paths</span>
          <strong>{stageMappings.length} mapped surfaces</strong>
        </div>
      </div>

      <div className="panel-title-row">
        <h3>Stage Explorer</h3>
        <span>{pipeline.deliveryChain.stages.length} stages</span>
      </div>

      <div className="delivery-chain-workspace__stage-strip">
        {pipeline.deliveryChain.stages.map((stage) => {
          const stagePipeline = pipeline.stages.find((entry) => entry.id === stage.pipelineStageId) ?? null;
          const stageQueue = stagePipeline ? selectStudioReleaseReviewerQueue(pipeline, stagePipeline) ?? null : null;
          const active = stage.id === selectedDeliveryStage?.id;

          return (
            <button
              key={stage.id}
              type="button"
              className={`workflow-step-card workflow-step-card--${resolveStageTone(stage.status)}${active ? " workflow-step-card--active" : ""}`}
              onClick={() => {
                setSelectedStageId(stage.id);
              }}
            >
              <div className="workflow-step-card__meta">
                <span>{stage.phase}</span>
                <strong>{stage.status}</strong>
              </div>
              <h3>{stage.label}</h3>
              <p>{stage.posture}</p>
              <div className="windowing-card__meta">
                <span className={`windowing-badge${active ? " windowing-badge--active" : ""}`}>{stage.owner}</span>
                <span className="windowing-badge">{stage.artifactGroups.length} groups</span>
                <span className="windowing-badge">{stage.blockedBy.length} blockers</span>
                <span className="windowing-badge">{stageQueue ? stageQueue.acknowledgementState : "no queue"}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="delivery-chain-workspace__detail-grid">
        <article className="windowing-summary-card windowing-summary-card--active">
          <span>Selected Delivery Stage</span>
          <strong>{selectedDeliveryStage?.label ?? "No selected stage"}</strong>
          <p>
            {selectedDeliveryStage?.summary ??
              "Select a delivery-chain stage to inspect ownership, linked artifacts, review posture, and downstream gates."}
          </p>
          <div className="workflow-readiness-list">
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveStageTone(selectedDeliveryStage?.status ?? "blocked")}`}>
              <span>Stage posture</span>
              <strong>{selectedDeliveryStage ? `${selectedDeliveryStage.status} / ${selectedDeliveryStage.posture}` : "Unavailable"}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Pipeline board</span>
              <strong>{selectedPipelineStage?.label ?? "Unavailable"}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Owner / queue</span>
              <strong>{selectedReviewerQueue ? `${selectedDeliveryStage?.owner ?? "owner"} / ${selectedReviewerQueue.owner}` : "Unavailable"}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Lifecycle / slots</span>
              <strong>
                {selectedPipelineStage
                  ? `${selectedPipelineStage.linkedLifecycleStages.length} lifecycle / ${selectedPipelineStage.linkedSlotIds.length} slot`
                  : "Unavailable"}
              </strong>
            </div>
          </div>
          {!compact && selectedPipelineStage ? (
            <div className="windowing-preview-list">
              <div className="windowing-preview-line">
                <span>Linked lifecycle</span>
                <strong>{selectedPipelineStage.linkedLifecycleStages.join(" / ")}</strong>
              </div>
              <div className="windowing-preview-line">
                <span>Linked slots</span>
                <strong>{selectedPipelineStage.linkedSlotIds.join(" / ")}</strong>
              </div>
            </div>
          ) : null}
        </article>

        <article className="windowing-summary-card">
          <span>Related Review Surfaces</span>
          <strong>{selectedPipelineStage?.packet.label ?? "No review packet"}</strong>
          <p>
            {selectedPipelineStage
              ? "Delivery-chain stage selection now resolves the exact packet, queue, handoff, closeout, escalation window, and closeout window that shape the current review posture."
              : "No review surface metadata is available for the selected stage."}
          </p>
          <div className="workflow-readiness-list">
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveReviewerQueueTone(selectedReviewerQueue?.status ?? "escalated")}`}>
              <span>Reviewer queue</span>
              <strong>{selectedReviewerQueue ? `${selectedReviewerQueue.status} / ${selectedReviewerQueue.owner}` : "Unavailable"}</strong>
            </div>
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveAcknowledgementTone(selectedPipelineStage?.handoff.acknowledgementState ?? "blocked")}`}>
              <span>Decision handoff</span>
              <strong>{selectedPipelineStage ? `${selectedPipelineStage.handoff.batonState} / ${selectedPipelineStage.handoff.acknowledgementState}` : "Unavailable"}</strong>
            </div>
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveSealTone(selectedPipelineStage?.closeout.sealingState ?? "blocked")}`}>
              <span>Evidence closeout</span>
              <strong>{selectedPipelineStage ? `${selectedPipelineStage.closeout.sealingState} / ${selectedPipelineStage.closeout.owner}` : "Unavailable"}</strong>
            </div>
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveEscalationTone(selectedEscalationWindow?.state ?? "blocked")}`}>
              <span>Escalation window</span>
              <strong>{selectedEscalationWindow ? `${selectedEscalationWindow.state} / ${selectedEscalationWindow.deadlineLabel}` : "Unavailable"}</strong>
            </div>
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveCloseoutWindowTone(selectedCloseoutWindow?.state ?? "blocked")}`}>
              <span>Closeout window</span>
              <strong>{selectedCloseoutWindow ? `${selectedCloseoutWindow.state} / ${selectedCloseoutWindow.deadlineLabel}` : "Unavailable"}</strong>
            </div>
          </div>
          {!compact && selectedReviewerQueue ? (
            <div className="windowing-preview-list">
              <div className="windowing-preview-line">
                <span>Active queue entry</span>
                <strong>{activeQueueEntry ? `${activeQueueEntry.owner} / ${activeQueueEntry.status}` : "Unavailable"}</strong>
              </div>
              <div className="windowing-preview-line">
                <span>Review packet</span>
                <strong>{selectedPipelineStage ? `${selectedPipelineStage.packet.status} / ${selectedPipelineStage.packet.owner}` : "Unavailable"}</strong>
              </div>
            </div>
          ) : null}
        </article>

        <article className="windowing-summary-card">
          <span>Observability Mapping</span>
          <strong>
            {activeStageMapping
              ? `${activeStageMapping.label} / ${formatReviewPostureRelationship(activeStageMapping.relationship)}`
              : "No mapped review posture"}
          </strong>
          <p>
            {activeStageMapping?.summary ??
              "No route, window, lane, board, and focused-slot mapping is currently attached to the selected delivery stage."}
          </p>
          <div className="workflow-readiness-list">
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Mapped surfaces</span>
              <strong>{stageMappings.length} posture paths</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Primary owner</span>
              <strong>{activeStageMapping?.owner ?? selectedDeliveryStage?.owner ?? "Unavailable"}</strong>
            </div>
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveAcknowledgementTone(activeStageMapping?.reviewPosture.acknowledgementState ?? "blocked")}`}>
              <span>Queue / acknowledgement</span>
              <strong>
                {activeStageMapping
                  ? `${activeStageMapping.reviewPosture.reviewerQueueId} / ${activeStageMapping.reviewPosture.acknowledgementState}`
                  : "Unavailable"}
              </strong>
            </div>
          </div>
          {stageMappings.length > 0 ? (
            <div className="windowing-preview-list">
              {(compact ? stageMappings.slice(0, 2) : stageMappings).map((mapping) => {
                const mappingWindow = windowing?.roster.windows.find((entry) => entry.id === mapping.windowId);
                const mappingLane = windowing?.sharedState.lanes.find((lane) => lane.id === mapping.sharedStateLaneId);
                const mappingBoard = windowing?.orchestration.boards.find((board) => board.id === mapping.orchestrationBoardId);

                return (
                  <div key={mapping.id} className="windowing-preview-line windowing-preview-line--stacked">
                    <span>{mapping.label}</span>
                    <strong>
                      {mapping.routeId} / {mappingWindow?.label ?? mapping.windowId}
                    </strong>
                    <p>
                      {formatReviewPostureRelationship(mapping.relationship)} / {mappingLane?.label ?? mapping.sharedStateLaneId} /{" "}
                      {mappingBoard?.label ?? mapping.orchestrationBoardId} / {mapping.focusedSlotId}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : null}
        </article>
      </div>

      <div className="delivery-chain-workspace__explorer-grid">
        <article className="windowing-summary-card">
          <span>Delivery Flow</span>
          <strong>{selectedDeliveryStage?.label ?? "No selected stage"}</strong>
          <p>
            Selected stage posture stays anchored to upstream evidence, downstream gates, and explicit promotion/publish/rollback branches instead of a flat artifact list.
          </p>
          <div className="workflow-readiness-list">
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Upstream stages</span>
              <strong>{upstreamStages.length > 0 ? upstreamStages.map((stage) => stage.label).join(" -> ") : "Chain entry"}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Downstream stages</span>
              <strong>{downstreamStages.length > 0 ? downstreamStages.map((stage) => stage.label).join(" -> ") : "No downstream stage"}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Promotion path</span>
              <strong>{pipeline.deliveryChain.promotionStageIds.map((stageId) => selectStudioReleaseDeliveryChainStage(pipeline, stageId)?.label ?? stageId).join(" / ")}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--warning">
              <span>Publish gate</span>
              <strong>{publishStage ? `${publishStage.label} / ${publishStage.status}` : "Unavailable"}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--warning">
              <span>Rollback path</span>
              <strong>{rollbackStage ? `${rollbackStage.label} / ${rollbackStage.status}` : "Unavailable"}</strong>
            </div>
          </div>
        </article>

        <article className="windowing-summary-card">
          <span>Artifact Coverage</span>
          <strong>{selectedArtifactGroup?.label ?? "No artifact group"}</strong>
          <p>
            {selectedArtifactGroup?.summary ??
              "Select a delivery stage to inspect grouped review artifacts and how they line up with packet evidence and closeout posture."}
          </p>
          {selectedDeliveryStage ? (
            <div className="delivery-chain-workspace__artifact-groups">
              {selectedDeliveryStage.artifactGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className={group.id === selectedArtifactGroup?.id ? "windowing-card windowing-card--active" : "windowing-card"}
                  onClick={() => {
                    setSelectedArtifactGroupId(group.id);
                  }}
                >
                  <span>{group.label}</span>
                  <strong>{group.artifacts.length} artifacts</strong>
                  <p>{group.summary}</p>
                </button>
              ))}
            </div>
          ) : null}
          {selectedArtifactGroup ? (
            <div className="windowing-preview-list">
              {(compact ? selectedArtifactGroup.artifacts.slice(0, 4) : selectedArtifactGroup.artifacts).map((artifact) => {
                const coverage = resolveArtifactCoverage(artifact, selectedPipelineStage ?? null, selectedCloseoutWindow ?? null);

                return (
                  <div key={artifact} className="windowing-preview-line windowing-preview-line--stacked">
                    <span>{coverage.label}</span>
                    <strong>{artifact}</strong>
                    <p>{coverage.detail}</p>
                    <div className="trace-note-links">
                      {coverage.badges.map((badge) => (
                        <span key={`${artifact}-${badge}`} className={`windowing-badge${coverage.tone === "positive" ? " windowing-badge--active" : ""}`}>
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </article>

        <article className="windowing-summary-card">
          <span>Blockers / Handoff Posture</span>
          <strong>{selectedPipelineStage?.handoff.label ?? "No handoff posture"}</strong>
          <p>
            Blockers stay connected to the selected stage handoff, active queue entry, and evidence closeout so delayed promotion, publish, and rollback posture can be reviewed from one place.
          </p>
          <div className="workflow-readiness-list">
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveBatonTone(selectedPipelineStage?.handoff.batonState ?? "blocked")}`}>
              <span>Handoff posture</span>
              <strong>{selectedPipelineStage ? `${selectedPipelineStage.handoff.batonState} / ${selectedPipelineStage.handoff.targetOwner}` : "Unavailable"}</strong>
            </div>
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveAcknowledgementTone(activeQueueEntry?.acknowledgementState ?? "blocked")}`}>
              <span>Active acknowledgement</span>
              <strong>{activeQueueEntry ? `${activeQueueEntry.acknowledgementState} / ${activeQueueEntry.owner}` : "Unavailable"}</strong>
            </div>
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveSealTone(selectedPipelineStage?.closeout.sealingState ?? "blocked")}`}>
              <span>Closeout posture</span>
              <strong>{selectedPipelineStage ? `${selectedPipelineStage.closeout.sealingState} / ${selectedPipelineStage.closeout.pendingEvidence.length} pending` : "Unavailable"}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--warning">
              <span>Stage blockers</span>
              <strong>{selectedDeliveryStage?.blockedBy.length ?? 0} active blockers</strong>
            </div>
          </div>
          <div className="windowing-preview-list">
            {(compact ? selectedDeliveryStage?.blockedBy.slice(0, 3) ?? [] : selectedDeliveryStage?.blockedBy ?? []).map((blocker) => (
              <div key={blocker} className="windowing-preview-line windowing-preview-line--stacked">
                <span>Blocker</span>
                <strong>{blocker}</strong>
              </div>
            ))}
            {(compact ? selectedPipelineStage?.handoff.pending.slice(0, 3) ?? [] : selectedPipelineStage?.handoff.pending ?? []).map((pending) => (
              <div key={pending} className="windowing-preview-line windowing-preview-line--stacked">
                <span>Pending handoff</span>
                <strong>{pending}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>
    </article>
  );
}
