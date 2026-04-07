import type {
  StudioReleaseApprovalAuditRollbackEntryCheckpoint,
  StudioReleaseApprovalPipeline,
  StudioReleaseApprovalWorkflowStage,
  StudioReleaseApprovalPipelineStage,
  StudioReleasePackagedAppBundleSealingReadiness,
  StudioReleaseCloseoutWindow,
  StudioReleaseDeliveryChainStage,
  StudioReleaseEscalationWindow,
  StudioReleasePackagedAppLocalMaterializationProgress,
  StudioReleaseQaCloseoutReadinessTrack,
  StudioReleasePackagedAppStagedOutputChain,
  StudioReleasePackagedAppStagedOutputChainStep,
  StudioReleasePackagedAppMaterializationContractPlatform,
  StudioReleasePackagedAppMaterializationContractTask,
  StudioReleaseRollbackLiveReadinessContract,
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

export function selectStudioReleasePackagedAppMaterializationContractStagedOutputChain(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null
): StudioReleasePackagedAppStagedOutputChain | undefined {
  return selectStudioReleasePackagedAppMaterializationContractPlatform(deliveryChain, platformOrId)?.stagedOutputChain;
}

export function selectStudioReleasePackagedAppMaterializationContractStagedOutputStep(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null,
  stepOrId?: Pick<StudioReleasePackagedAppStagedOutputChainStep, "id"> | string | null
): StudioReleasePackagedAppStagedOutputChainStep | undefined {
  const chain = selectStudioReleasePackagedAppMaterializationContractStagedOutputChain(deliveryChain, platformOrId);
  const stepId = typeof stepOrId === "string" ? stepOrId : stepOrId?.id ?? chain?.currentStepId;

  return chain?.steps.find((step) => step.id === stepId) ?? chain?.steps[0];
}

export function selectStudioReleasePackagedAppMaterializationContractBundleSealingReadiness(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null
): StudioReleasePackagedAppBundleSealingReadiness | undefined {
  return selectStudioReleasePackagedAppMaterializationContractPlatform(deliveryChain, platformOrId)?.bundleSealingReadiness;
}

export function selectStudioReleasePackagedAppMaterializationContractProgress(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null
): StudioReleasePackagedAppLocalMaterializationProgress | undefined {
  return selectStudioReleasePackagedAppMaterializationContractPlatform(deliveryChain, platformOrId)?.localMaterializationProgress;
}

export function selectStudioReleaseQaCloseoutReadinessTrack(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "stageCReadiness">,
  trackOrId?: Pick<StudioReleaseQaCloseoutReadinessTrack, "id"> | string | null
): StudioReleaseQaCloseoutReadinessTrack | undefined {
  const readiness = deliveryChain.stageCReadiness.releaseQaCloseoutReadiness;
  const trackId = typeof trackOrId === "string" ? trackOrId : trackOrId?.id ?? readiness.activeTrackId;

  return readiness.tracks.find((track) => track.id === trackId) ?? readiness.tracks[0];
}

export function selectStudioReleaseApprovalWorkflowStage(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "stageCReadiness">,
  stageOrId?: Pick<StudioReleaseApprovalWorkflowStage, "id"> | string | null
): StudioReleaseApprovalWorkflowStage | undefined {
  const workflow = deliveryChain.stageCReadiness.approvalWorkflow;
  const stageId = typeof stageOrId === "string" ? stageOrId : stageOrId?.id ?? workflow.activeStageId;

  return workflow.stages.find((stage) => stage.id === stageId) ?? workflow.stages[0];
}

export function selectStudioReleaseApprovalAuditRollbackEntryCheckpoint(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "stageCReadiness">,
  checkpointOrId?: Pick<StudioReleaseApprovalAuditRollbackEntryCheckpoint, "id"> | string | null
): StudioReleaseApprovalAuditRollbackEntryCheckpoint | undefined {
  const entryContract = deliveryChain.stageCReadiness.entryContract;
  const checkpointId = typeof checkpointOrId === "string" ? checkpointOrId : checkpointOrId?.id ?? entryContract.activeCheckpointId;

  return entryContract.checkpoints.find((checkpoint) => checkpoint.id === checkpointId) ?? entryContract.checkpoints[0];
}

export function selectStudioReleaseRollbackLiveReadinessContract(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "stageCReadiness">,
  contractOrId?: Pick<StudioReleaseRollbackLiveReadinessContract, "id"> | string | null
): StudioReleaseRollbackLiveReadinessContract | undefined {
  const rollbackReadiness = deliveryChain.stageCReadiness.rollbackLiveReadiness;
  const contractId = typeof contractOrId === "string" ? contractOrId : contractOrId?.id ?? rollbackReadiness.activeContractId;

  return rollbackReadiness.contracts.find((contract) => contract.id === contractId) ?? rollbackReadiness.contracts[0];
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
