import type {
  StudioReleaseApprovalPipeline,
  StudioReleaseApprovalPipelineStage,
  StudioReleaseCloseoutWindow,
  StudioReleaseDeliveryChainStage,
  StudioReleaseEscalationWindow,
  StudioReleasePackagedAppMaterializationContractPlatform,
  StudioReleasePackagedAppMaterializationContractTask,
  StudioReleaseReviewerQueue,
  StudioReviewStateContinuity,
  StudioReviewStateContinuityEntry,
  StudioReviewStateContinuityMatch,
  StudioWindowObservabilityMapping,
  StudioWindowing
} from "./index.js";

export function selectStudioReleaseApprovalPipelineStage(
  pipeline: Pick<StudioReleaseApprovalPipeline, "stages" | "currentStageId">
): StudioReleaseApprovalPipelineStage | undefined {
  return pipeline.stages.find((stage) => stage.id === pipeline.currentStageId) ?? pipeline.stages[0];
}

export function selectStudioReleaseReviewerQueue(
  pipeline: Pick<StudioReleaseApprovalPipeline, "reviewerQueues" | "stages" | "currentStageId">,
  stage?: Pick<StudioReleaseApprovalPipelineStage, "id" | "reviewerQueueId">
): StudioReleaseReviewerQueue | undefined {
  const resolvedStage = stage ?? selectStudioReleaseApprovalPipelineStage(pipeline);
  return (
    pipeline.reviewerQueues.find((queue) => queue.id === resolvedStage?.reviewerQueueId) ??
    pipeline.reviewerQueues.find((queue) => queue.stageId === resolvedStage?.id) ??
    pipeline.reviewerQueues[0]
  );
}

export function selectStudioReleaseEscalationWindow(
  pipeline: Pick<StudioReleaseApprovalPipeline, "escalationWindows" | "stages" | "currentStageId">,
  stage?: Pick<StudioReleaseApprovalPipelineStage, "id" | "escalationWindowId">
): StudioReleaseEscalationWindow | undefined {
  const resolvedStage = stage ?? selectStudioReleaseApprovalPipelineStage(pipeline);
  return (
    pipeline.escalationWindows.find((window) => window.id === resolvedStage?.escalationWindowId) ??
    pipeline.escalationWindows.find((window) => window.stageId === resolvedStage?.id) ??
    pipeline.escalationWindows[0]
  );
}

export function selectStudioReleaseCloseoutWindow(
  pipeline: Pick<StudioReleaseApprovalPipeline, "closeoutWindows" | "stages" | "currentStageId">,
  stage?: Pick<StudioReleaseApprovalPipelineStage, "id" | "closeoutWindowId">
): StudioReleaseCloseoutWindow | undefined {
  const resolvedStage = stage ?? selectStudioReleaseApprovalPipelineStage(pipeline);
  return (
    pipeline.closeoutWindows.find((window) => window.id === resolvedStage?.closeoutWindowId) ??
    pipeline.closeoutWindows.find((window) => window.stageId === resolvedStage?.id) ??
    pipeline.closeoutWindows[0]
  );
}

export function selectStudioReleaseDeliveryChainStage(
  pipeline: Pick<StudioReleaseApprovalPipeline, "deliveryChain">,
  stageOrId?: Pick<StudioReleaseApprovalPipelineStage, "deliveryChainStageId"> | string | null
): StudioReleaseDeliveryChainStage | undefined {
  const deliveryStageId =
    typeof stageOrId === "string" ? stageOrId : stageOrId?.deliveryChainStageId ?? pipeline.deliveryChain.currentStageId;

  return (
    pipeline.deliveryChain.stages.find((stage) => stage.id === deliveryStageId) ??
    pipeline.deliveryChain.stages.find((stage) => stage.id === pipeline.deliveryChain.currentStageId) ??
    pipeline.deliveryChain.stages[0]
  );
}

export function selectStudioReleasePackagedAppMaterializationContractPlatform(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null
): StudioReleasePackagedAppMaterializationContractPlatform | undefined {
  const contract = deliveryChain.packagedAppMaterializationContract;
  const platformId = typeof platformOrId === "string" ? platformOrId : platformOrId?.id ?? contract.activePlatformId;

  return (
    contract.platforms.find((platform) => platform.id === platformId) ??
    contract.platforms.find((platform) => platform.id === contract.activePlatformId) ??
    contract.platforms[0]
  );
}

export function selectStudioReleasePackagedAppMaterializationContractTask(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null,
  taskOrId?: Pick<StudioReleasePackagedAppMaterializationContractTask, "id"> | string | null
): StudioReleasePackagedAppMaterializationContractTask | undefined {
  const platform = selectStudioReleasePackagedAppMaterializationContractPlatform(deliveryChain, platformOrId);
  const taskId = typeof taskOrId === "string" ? taskOrId : taskOrId?.id ?? platform?.currentTaskId;

  return platform?.tasks.find((task) => task.id === taskId) ?? platform?.tasks[0];
}

export function selectStudioReviewStateContinuityActiveEntry(
  continuity: Pick<StudioReviewStateContinuity, "entries" | "activeEntryId">
): StudioReviewStateContinuityEntry | undefined {
  return continuity.entries.find((entry) => entry.id === continuity.activeEntryId) ?? continuity.entries[0];
}

function scoreStudioReviewStateContinuityEntry(
  entry: StudioReviewStateContinuityEntry,
  match: StudioReviewStateContinuityMatch | undefined
): number {
  if (!match) {
    return 0;
  }

  let score = 0;

  if (match.reviewSurfaceActionId && entry.surface.actionId === match.reviewSurfaceActionId) {
    score += 64;
  }

  if (match.observabilityMappingId && entry.spine.observabilityMappingId === match.observabilityMappingId) {
    score += 32;
  }

  if (match.sharedStateLaneId && entry.spine.sharedStateLaneId === match.sharedStateLaneId) {
    score += 16;
  }

  if (match.orchestrationBoardId && entry.spine.orchestrationBoardId === match.orchestrationBoardId) {
    score += 8;
  }

  if (match.windowId && entry.spine.windowId === match.windowId) {
    score += 4;
  }

  return score;
}

export function selectStudioReviewStateContinuityEntry(
  continuity: Pick<StudioReviewStateContinuity, "entries" | "activeEntryId">,
  match?: StudioReviewStateContinuityMatch
): StudioReviewStateContinuityEntry | undefined {
  if (match?.entryId) {
    const exactEntry = continuity.entries.find((entry) => entry.id === match.entryId);

    if (exactEntry) {
      return exactEntry;
    }
  }

  const scoredEntries = continuity.entries
    .map((entry) => ({
      entry,
      score: scoreStudioReviewStateContinuityEntry(entry, match)
    }))
    .sort((left, right) => right.score - left.score);

  if ((scoredEntries[0]?.score ?? 0) > 0) {
    return scoredEntries[0]?.entry;
  }

  return selectStudioReviewStateContinuityActiveEntry(continuity);
}

export function selectStudioWindowObservabilityActiveMapping(
  windowing: Pick<StudioWindowing, "observability">
): StudioWindowObservabilityMapping | undefined {
  return (
    windowing.observability.mappings.find((mapping) => mapping.id === windowing.observability.activeMappingId) ??
    windowing.observability.mappings[0]
  );
}

export function selectStudioWindowObservabilityMapping(
  windowing: Pick<StudioWindowing, "observability">,
  mappingId?: string | null
): StudioWindowObservabilityMapping | undefined {
  if (mappingId) {
    const mapping = windowing.observability.mappings.find((entry) => entry.id === mappingId);

    if (mapping) {
      return mapping;
    }
  }

  return selectStudioWindowObservabilityActiveMapping(windowing);
}
