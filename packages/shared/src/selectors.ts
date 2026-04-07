import type {
  StudioCommandAction,
  StudioCommandActionDeck,
  StudioReleaseApprovalAuditRollbackEntryCheckpoint,
  StudioReleaseApprovalPipeline,
  StudioReleaseApprovalWorkflowStage,
  StudioReleaseApprovalPipelineStage,
  StudioReleasePackagedAppBundleSealingCheckpoint,
  StudioReleasePackagedAppBundleSealingReadiness,
  StudioReleaseCloseoutWindow,
  StudioReleaseDeliveryChainStage,
  StudioReleaseEscalationWindow,
  StudioReleasePackagedAppLocalMaterializationProgress,
  StudioReleasePackagedAppLocalMaterializationSegment,
  StudioReleasePackagedAppMaterializationReviewPacket,
  StudioReleasePackagedAppMaterializationReviewPacketStep,
  StudioReleasePackagedAppMaterializationValidatorObservabilityBridge,
  StudioReleasePackagedAppMaterializationValidatorObservabilityReadout,
  StudioReleasePackagedAppMaterializationFailurePath,
  StudioReleasePackagedAppMaterializationFailureReadout,
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
  StudioWindowObservabilitySignal,
  StudioWindowObservabilityMapping,
  StudioWindowOrchestrationBoard,
  StudioWindowRosterEntry,
  StudioWindowSharedStateLane,
  StudioWindowing
} from "./index.js";

function isStudioReviewCoverageAction(
  action: StudioCommandAction
): action is StudioCommandAction &
  {
    kind: "focus-review-coverage";
  } &
  Required<
    Pick<
      StudioCommandAction,
      "reviewSurfaceKind" | "deliveryChainStageId" | "windowId" | "sharedStateLaneId" | "orchestrationBoardId" | "observabilityMappingId"
    >
  > {
  return Boolean(
    action.kind === "focus-review-coverage" &&
      action.reviewSurfaceKind &&
      action.deliveryChainStageId &&
      action.windowId &&
      action.sharedStateLaneId &&
      action.orchestrationBoardId &&
      action.observabilityMappingId
  );
}

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

export function selectStudioReleasePackagedAppMaterializationContractStagedOutputNextStep(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null
): StudioReleasePackagedAppStagedOutputChainStep | undefined {
  const chain = selectStudioReleasePackagedAppMaterializationContractStagedOutputChain(deliveryChain, platformOrId);

  if (!chain?.nextStepId) {
    return undefined;
  }

  return chain.steps.find((step) => step.id === chain.nextStepId);
}

export function selectStudioReleasePackagedAppMaterializationContractReviewPacket(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null
): StudioReleasePackagedAppMaterializationReviewPacket | undefined {
  return selectStudioReleasePackagedAppMaterializationContractPlatform(deliveryChain, platformOrId)?.reviewPacket;
}

export function selectStudioReleasePackagedAppMaterializationContractReviewPacketStep(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null,
  stepOrId?: Pick<StudioReleasePackagedAppMaterializationReviewPacketStep, "id"> | string | null
): StudioReleasePackagedAppMaterializationReviewPacketStep | undefined {
  const reviewPacket = selectStudioReleasePackagedAppMaterializationContractReviewPacket(deliveryChain, platformOrId);
  const stepId = typeof stepOrId === "string" ? stepOrId : stepOrId?.id ?? reviewPacket?.currentStepId;

  return reviewPacket?.steps.find((step) => step.id === stepId) ?? reviewPacket?.steps[0];
}

export function selectStudioReleasePackagedAppMaterializationContractBundleSealingReadiness(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null
): StudioReleasePackagedAppBundleSealingReadiness | undefined {
  return selectStudioReleasePackagedAppMaterializationContractPlatform(deliveryChain, platformOrId)?.bundleSealingReadiness;
}

export function selectStudioReleasePackagedAppMaterializationContractBundleSealingCheckpoint(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null,
  checkpointOrId?: Pick<StudioReleasePackagedAppBundleSealingCheckpoint, "id"> | string | null
): StudioReleasePackagedAppBundleSealingCheckpoint | undefined {
  const readiness = selectStudioReleasePackagedAppMaterializationContractBundleSealingReadiness(deliveryChain, platformOrId);
  const checkpointId = typeof checkpointOrId === "string" ? checkpointOrId : checkpointOrId?.id ?? readiness?.activeCheckpointId;

  return readiness?.checkpoints.find((checkpoint) => checkpoint.id === checkpointId) ?? readiness?.checkpoints[0];
}

export function selectStudioReleasePackagedAppMaterializationContractProgress(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null
): StudioReleasePackagedAppLocalMaterializationProgress | undefined {
  return selectStudioReleasePackagedAppMaterializationContractPlatform(deliveryChain, platformOrId)?.localMaterializationProgress;
}

export function selectStudioReleasePackagedAppMaterializationContractProgressSegment(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null,
  segmentOrId?: Pick<StudioReleasePackagedAppLocalMaterializationSegment, "id"> | string | null
): StudioReleasePackagedAppLocalMaterializationSegment | undefined {
  const progress = selectStudioReleasePackagedAppMaterializationContractProgress(deliveryChain, platformOrId);
  const segmentId = typeof segmentOrId === "string" ? segmentOrId : segmentOrId?.id ?? progress?.activeSegmentId;

  return progress?.segments.find((segment) => segment.id === segmentId) ?? progress?.segments[0];
}

export function selectStudioReleasePackagedAppMaterializationContractNextProgressSegment(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null
): StudioReleasePackagedAppLocalMaterializationSegment | undefined {
  const progress = selectStudioReleasePackagedAppMaterializationContractProgress(deliveryChain, platformOrId);
  const activeSegment = selectStudioReleasePackagedAppMaterializationContractProgressSegment(deliveryChain, platformOrId);

  if (!progress?.segments.length) {
    return undefined;
  }

  const activeIndex = progress.segments.findIndex((segment) => segment.id === activeSegment?.id);
  const nextSegment =
    progress.segments.slice(activeIndex + 1).find((segment) => segment.status === "up-next" || segment.status === "blocked") ??
    progress.segments.find((segment) => segment.status === "up-next" || segment.status === "blocked");

  return nextSegment;
}

export function selectStudioReleasePackagedAppMaterializationContractValidatorObservabilityBridge(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null
): StudioReleasePackagedAppMaterializationValidatorObservabilityBridge | undefined {
  return selectStudioReleasePackagedAppMaterializationContractPlatform(deliveryChain, platformOrId)?.validatorObservabilityBridge;
}

export function selectStudioReleasePackagedAppMaterializationContractValidatorObservabilityReadout(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null,
  readoutOrId?: Pick<StudioReleasePackagedAppMaterializationValidatorObservabilityReadout, "id"> | string | null
): StudioReleasePackagedAppMaterializationValidatorObservabilityReadout | undefined {
  const bridge = selectStudioReleasePackagedAppMaterializationContractValidatorObservabilityBridge(deliveryChain, platformOrId);
  const readoutId = typeof readoutOrId === "string" ? readoutOrId : readoutOrId?.id ?? bridge?.activeReadoutId;

  return bridge?.readouts.find((readout) => readout.id === readoutId) ?? bridge?.readouts[0];
}

export function selectStudioReleasePackagedAppMaterializationContractNextValidatorObservabilityReadout(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null
): StudioReleasePackagedAppMaterializationValidatorObservabilityReadout | undefined {
  const bridge = selectStudioReleasePackagedAppMaterializationContractValidatorObservabilityBridge(deliveryChain, platformOrId);

  if (!bridge?.nextReadoutId) {
    return undefined;
  }

  return bridge.readouts.find((readout) => readout.id === bridge.nextReadoutId);
}

export function selectStudioReleasePackagedAppMaterializationContractFailurePath(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null
): StudioReleasePackagedAppMaterializationFailurePath | undefined {
  return selectStudioReleasePackagedAppMaterializationContractPlatform(deliveryChain, platformOrId)?.failurePath;
}

export function selectStudioReleasePackagedAppMaterializationContractFailureReadout(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null,
  readoutOrId?: Pick<StudioReleasePackagedAppMaterializationFailureReadout, "id"> | string | null
): StudioReleasePackagedAppMaterializationFailureReadout | undefined {
  const failurePath = selectStudioReleasePackagedAppMaterializationContractFailurePath(deliveryChain, platformOrId);
  const readoutId = typeof readoutOrId === "string" ? readoutOrId : readoutOrId?.id ?? failurePath?.activeReadoutId;

  return failurePath?.readouts.find((readout) => readout.id === readoutId) ?? failurePath?.readouts[0];
}

export function selectStudioReleasePackagedAppMaterializationContractNextFailureReadout(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null
): StudioReleasePackagedAppMaterializationFailureReadout | undefined {
  const failurePath = selectStudioReleasePackagedAppMaterializationContractFailurePath(deliveryChain, platformOrId);

  if (!failurePath?.nextReadoutId) {
    return undefined;
  }

  return failurePath.readouts.find((readout) => readout.id === failurePath.nextReadoutId);
}

export function selectStudioReleasePackagedAppMaterializationContractFailureSurfaceMatch(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract" | "stageCReadiness">,
  windowing?: Pick<StudioWindowing, "observability" | "roster" | "sharedState" | "orchestration"> | null,
  reviewStateContinuity?: Pick<StudioReviewStateContinuity, "entries" | "activeEntryId"> | null,
  actionDeck?: Pick<StudioCommandActionDeck, "lanes"> | null,
  reviewSurfaceActions?: StudioCommandAction[] | null,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null,
  readoutOrId?: Pick<StudioReleasePackagedAppMaterializationFailureReadout, "id"> | string | null
): {
  failurePath: StudioReleasePackagedAppMaterializationFailurePath | null;
  activeReadout: StudioReleasePackagedAppMaterializationFailureReadout | null;
  nextReadout: StudioReleasePackagedAppMaterializationFailureReadout | null;
  reviewPacketStep: StudioReleasePackagedAppMaterializationReviewPacketStep | null;
  validatorReadout: StudioReleasePackagedAppMaterializationValidatorObservabilityReadout | null;
  rollbackContract: StudioReleaseRollbackLiveReadinessContract | null;
  primaryAction: (StudioCommandAction &
    {
      kind: "focus-review-coverage";
    } &
    Required<
      Pick<
        StudioCommandAction,
        "reviewSurfaceKind" | "deliveryChainStageId" | "windowId" | "sharedStateLaneId" | "orchestrationBoardId" | "observabilityMappingId"
      >
    >) | null;
  commandPreviewActions: Array<
    StudioCommandAction &
      {
        kind: "focus-review-coverage";
      } &
      Required<
        Pick<
          StudioCommandAction,
          "reviewSurfaceKind" | "deliveryChainStageId" | "windowId" | "sharedStateLaneId" | "orchestrationBoardId" | "observabilityMappingId"
        >
      >
  >;
  commandDeckLane: StudioCommandActionDeck["lanes"][number] | null;
  observabilityMapping: StudioWindowObservabilityMapping | null;
  observabilitySignals: StudioWindowObservabilitySignal[];
  window: StudioWindowRosterEntry | null;
  lane: StudioWindowSharedStateLane | null;
  board: StudioWindowOrchestrationBoard | null;
  reviewStateContinuityEntry: StudioReviewStateContinuityEntry | null;
} {
  const failurePath = selectStudioReleasePackagedAppMaterializationContractFailurePath(deliveryChain, platformOrId) ?? null;
  const activeReadout =
    selectStudioReleasePackagedAppMaterializationContractFailureReadout(deliveryChain, platformOrId, readoutOrId) ?? null;
  const nextReadout = selectStudioReleasePackagedAppMaterializationContractNextFailureReadout(deliveryChain, platformOrId) ?? null;

  if (!activeReadout) {
    return {
      failurePath,
      activeReadout,
      nextReadout,
      reviewPacketStep: null,
      validatorReadout: null,
      rollbackContract: null,
      primaryAction: null,
      commandPreviewActions: [],
      commandDeckLane: null,
      observabilityMapping: null,
      observabilitySignals: [],
      window: null,
      lane: null,
      board: null,
      reviewStateContinuityEntry: null
    };
  }

  const reviewPacketStep =
    selectStudioReleasePackagedAppMaterializationContractReviewPacketStep(
      deliveryChain,
      platformOrId,
      activeReadout.reviewPacketStepId
    ) ?? null;
  const validatorReadout =
    selectStudioReleasePackagedAppMaterializationContractValidatorObservabilityReadout(
      deliveryChain,
      platformOrId,
      activeReadout.validatorReadoutId
    ) ?? null;
  const rollbackContract = selectStudioReleaseRollbackLiveReadinessContract(deliveryChain, activeReadout.rollbackContractId) ?? null;
  const commandPreviewActions =
    reviewSurfaceActions
      ?.filter(isStudioReviewCoverageAction)
      .filter((action) => activeReadout.commandActionIds.includes(action.id)) ?? [];
  const commandDeckLane =
    actionDeck?.lanes.find((lane) => lane.id === activeReadout.commandDeckLaneId) ??
    actionDeck?.lanes.find((lane) => lane.actionIds.includes(activeReadout.commandActionIds[0] ?? "")) ??
    null;
  const primaryAction =
    commandPreviewActions.find((action) => action.reviewSurfaceKind === "failure-path") ??
    (commandDeckLane?.primaryActionId
      ? commandPreviewActions.find((action) => action.id === commandDeckLane.primaryActionId) ?? null
      : null) ??
    commandPreviewActions[0] ??
    null;

  if (!windowing || !primaryAction) {
    return {
      failurePath,
      activeReadout,
      nextReadout,
      reviewPacketStep,
      validatorReadout,
      rollbackContract,
      primaryAction,
      commandPreviewActions,
      commandDeckLane,
      observabilityMapping: null,
      observabilitySignals: [],
      window: null,
      lane: null,
      board: null,
      reviewStateContinuityEntry: null
    };
  }

  const observabilityMapping = selectStudioWindowObservabilityMapping(windowing, primaryAction.observabilityMappingId) ?? null;
  const observabilitySignals = activeReadout.observabilitySignalIds
    .map((signalId) => windowing.observability.signals.find((signal) => signal.id === signalId) ?? null)
    .filter((signal): signal is StudioWindowObservabilitySignal => Boolean(signal));
  const window = windowing.roster.windows.find((entry) => entry.id === primaryAction.windowId) ?? null;
  const lane = windowing.sharedState.lanes.find((entry) => entry.id === primaryAction.sharedStateLaneId) ?? null;
  const board = windowing.orchestration.boards.find((entry) => entry.id === primaryAction.orchestrationBoardId) ?? null;
  const reviewStateContinuityEntry = reviewStateContinuity
    ? selectStudioReviewStateContinuityEntry(reviewStateContinuity, {
        reviewSurfaceActionId: primaryAction.id,
        observabilityMappingId: primaryAction.observabilityMappingId,
        sharedStateLaneId: primaryAction.sharedStateLaneId,
        orchestrationBoardId: primaryAction.orchestrationBoardId,
        windowId: primaryAction.windowId
      }) ?? null
    : null;

  return {
    failurePath,
    activeReadout,
    nextReadout,
    reviewPacketStep,
    validatorReadout,
    rollbackContract,
    primaryAction,
    commandPreviewActions,
    commandDeckLane,
    observabilityMapping,
    observabilitySignals,
    window,
    lane,
    board,
    reviewStateContinuityEntry
  };
}

function scoreStudioReleasePackagedAppMaterializationBridgeContinuityEntry(
  entry: StudioReviewStateContinuityEntry,
  readout: StudioReleasePackagedAppMaterializationValidatorObservabilityReadout
): number {
  let score = 0;

  if (entry.spine.sharedStateLaneId === readout.sharedStateLaneId) {
    score += 16;
  }

  if (entry.spine.orchestrationBoardId === readout.orchestrationBoardId) {
    score += 8;
  }

  if (entry.spine.windowId === readout.windowId) {
    score += 4;
  }

  if (entry.deliveryChainStageId === readout.deliveryChainStageId) {
    score += 2;
  }

  return score;
}

export function selectStudioReleasePackagedAppMaterializationContractValidatorObservabilitySurfaceMatch(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract">,
  windowing?: Pick<StudioWindowing, "observability" | "roster" | "sharedState" | "orchestration"> | null,
  reviewStateContinuity?: Pick<StudioReviewStateContinuity, "entries" | "activeEntryId"> | null,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null,
  readoutOrId?: Pick<StudioReleasePackagedAppMaterializationValidatorObservabilityReadout, "id"> | string | null
): {
  bridge: StudioReleasePackagedAppMaterializationValidatorObservabilityBridge | null;
  activeReadout: StudioReleasePackagedAppMaterializationValidatorObservabilityReadout | null;
  nextReadout: StudioReleasePackagedAppMaterializationValidatorObservabilityReadout | null;
  observabilityMapping: StudioWindowObservabilityMapping | null;
  observabilitySignals: StudioWindowObservabilitySignal[];
  window: StudioWindowRosterEntry | null;
  lane: StudioWindowSharedStateLane | null;
  board: StudioWindowOrchestrationBoard | null;
  reviewStateContinuityEntry: StudioReviewStateContinuityEntry | null;
} {
  const bridge = selectStudioReleasePackagedAppMaterializationContractValidatorObservabilityBridge(deliveryChain, platformOrId) ?? null;
  const activeReadout =
    selectStudioReleasePackagedAppMaterializationContractValidatorObservabilityReadout(
      deliveryChain,
      platformOrId,
      readoutOrId
    ) ?? null;
  const nextReadout =
    selectStudioReleasePackagedAppMaterializationContractNextValidatorObservabilityReadout(deliveryChain, platformOrId) ?? null;

  if (!windowing || !activeReadout) {
    return {
      bridge,
      activeReadout,
      nextReadout,
      observabilityMapping: null,
      observabilitySignals: [],
      window: null,
      lane: null,
      board: null,
      reviewStateContinuityEntry: null
    };
  }

  const observabilityMapping = selectStudioWindowObservabilityMapping(windowing, activeReadout.observabilityMappingId) ?? null;
  const observabilitySignals = activeReadout.observabilitySignalIds
    .map((signalId) => windowing.observability.signals.find((signal) => signal.id === signalId) ?? null)
    .filter((signal): signal is StudioWindowObservabilitySignal => Boolean(signal));
  const window = windowing.roster.windows.find((entry) => entry.id === activeReadout.windowId) ?? null;
  const lane = windowing.sharedState.lanes.find((entry) => entry.id === activeReadout.sharedStateLaneId) ?? null;
  const board = windowing.orchestration.boards.find((entry) => entry.id === activeReadout.orchestrationBoardId) ?? null;
  const exactMappingEntries =
    reviewStateContinuity?.entries.filter(
      (entry) => entry.spine.observabilityMappingId === activeReadout.observabilityMappingId
    ) ?? [];
  const reviewStateContinuityEntry =
    exactMappingEntries
      .map((entry) => ({
        entry,
        score: scoreStudioReleasePackagedAppMaterializationBridgeContinuityEntry(entry, activeReadout)
      }))
      .sort((left, right) => right.score - left.score)[0]?.entry ?? null;

  return {
    bridge,
    activeReadout,
    nextReadout,
    observabilityMapping,
    observabilitySignals,
    window,
    lane,
    board,
    reviewStateContinuityEntry
  };
}

function collectStudioReleasePackagedAppMaterializationRelatedStageIds(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract" | "stageCReadiness">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null
): string[] {
  const contract = deliveryChain.packagedAppMaterializationContract;
  const platform = selectStudioReleasePackagedAppMaterializationContractPlatform(deliveryChain, platformOrId);
  const progress = platform?.localMaterializationProgress;
  const stageIds = new Set<string>([
    contract.ownerStageId,
    contract.downstreamGateStageId,
    deliveryChain.stageCReadiness.stageBBridgeStageId,
    deliveryChain.stageCReadiness.entryStageId
  ]);

  platform?.tasks.forEach((task) => stageIds.add(task.deliveryChainStageId));
  progress?.stageSequence.forEach((stageId) => stageIds.add(stageId));
  progress?.segments.forEach((segment) => stageIds.add(segment.deliveryChainStageId));

  return [...stageIds];
}

export function selectStudioReleasePackagedAppMaterializationContractNearbyStageCReadiness(
  deliveryChain: Pick<StudioReleaseApprovalPipeline["deliveryChain"], "packagedAppMaterializationContract" | "stageCReadiness">,
  platformOrId?: Pick<StudioReleasePackagedAppMaterializationContractPlatform, "id"> | string | null
): {
  stageIds: string[];
  qaTracks: StudioReleaseQaCloseoutReadinessTrack[];
  workflowStages: StudioReleaseApprovalWorkflowStage[];
  checkpoints: StudioReleaseApprovalAuditRollbackEntryCheckpoint[];
  rollbackContracts: StudioReleaseRollbackLiveReadinessContract[];
} {
  const stageIds = collectStudioReleasePackagedAppMaterializationRelatedStageIds(deliveryChain, platformOrId);
  const stageIdSet = new Set(stageIds);
  const { stageCReadiness } = deliveryChain;

  return {
    stageIds,
    qaTracks: stageCReadiness.releaseQaCloseoutReadiness.tracks.filter((track) => stageIdSet.has(track.deliveryChainStageId)),
    workflowStages: stageCReadiness.approvalWorkflow.stages.filter((stage) =>
      stage.deliveryChainStageIds.some((stageId) => stageIdSet.has(stageId))
    ),
    checkpoints: stageCReadiness.entryContract.checkpoints.filter((checkpoint) => stageIdSet.has(checkpoint.deliveryChainStageId)),
    rollbackContracts: stageCReadiness.rollbackLiveReadiness.contracts.filter((contract) => stageIdSet.has(contract.deliveryChainStageId))
  };
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
