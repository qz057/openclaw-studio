import type { StudioHostTraceSlotState, StudioReleaseDeliveryChainPhase } from "./index.js";

const releasePipelineStageToDeliveryChainStageId: Record<string, string> = {
  "release-pipeline-attestation-intake": "delivery-chain-attestation-intake",
  "release-pipeline-approval-orchestration": "delivery-chain-operator-review",
  "release-pipeline-lifecycle-enforcement": "delivery-chain-promotion-readiness",
  "release-pipeline-rollback-settlement": "delivery-chain-rollback-readiness"
};

const releasePipelineStageToDeliveryPhase: Record<string, StudioReleaseDeliveryChainPhase> = {
  "release-pipeline-attestation-intake": "attestation",
  "release-pipeline-approval-orchestration": "review",
  "release-pipeline-lifecycle-enforcement": "promotion",
  "release-pipeline-rollback-settlement": "rollback"
};

function scoreStudioHostTraceSlot(entry: StudioHostTraceSlotState): number {
  let score = entry.outcomeChain.length * 10;

  if (entry.rollbackDisposition === "incomplete") {
    score += 100;
  } else if (entry.rollbackDisposition === "required") {
    score += 80;
  } else if (entry.rollbackDisposition === "available") {
    score += 40;
  }

  switch (entry.primaryStatus) {
    case "rollback-required":
      score += 30;
      break;
    case "partial-apply":
      score += 20;
      break;
    case "abort":
      score += 10;
      break;
    default:
      break;
  }

  return score;
}

export function selectStudioHostTraceFocusSlotId(slotRoster: StudioHostTraceSlotState[], preferredSlotId?: string | null): string | null {
  if (preferredSlotId && slotRoster.some((entry) => entry.slotId === preferredSlotId)) {
    return preferredSlotId;
  }

  const focused = [...slotRoster].sort((left, right) => scoreStudioHostTraceSlot(right) - scoreStudioHostTraceSlot(left))[0];
  return focused?.slotId ?? null;
}

export function mapReleasePipelineStageToDeliveryChainStageId(stageId: string): string {
  return releasePipelineStageToDeliveryChainStageId[stageId] ?? "delivery-chain-publish-decision";
}

export function mapReleasePipelineStageToDeliveryPhase(stageId: string): StudioReleaseDeliveryChainPhase {
  return releasePipelineStageToDeliveryPhase[stageId] ?? "publish";
}
