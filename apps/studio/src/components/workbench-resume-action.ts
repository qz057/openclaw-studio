import type { StudioShellLayoutState } from "@openclaw/shared";
import type { PersistedWorkbenchState } from "./workbench-persistence";

export type WorkbenchResumeActionTone = "positive" | "warning" | "neutral";
export type WorkbenchResumeAnchorMode = "workspace" | "page" | "slot";
export type WorkbenchNativeResumeActionId =
  | "workbench-new-session"
  | "workbench-resume-last-workspace"
  | "workbench-restore-last-page"
  | "workbench-restore-last-slot"
  | "workbench-review-surface-focus"
  | "workbench-review-surface-handoff"
  | "workbench-review-surface-observability";
export type WorkbenchResumeActionKind =
  | "command-action"
  | "command-palette"
  | "restore-anchor"
  | "review-surface-focus"
  | "review-surface-handoff"
  | "review-surface-observability";

export interface WorkbenchResumeCommandActionLike {
  id: string;
  label: string;
  description: string;
  tone: WorkbenchResumeActionTone;
}

export interface WorkbenchResumeActionDescriptor {
  id: string;
  label: string;
  description: string;
  tone: WorkbenchResumeActionTone;
  kind: WorkbenchResumeActionKind;
  anchorMode?: WorkbenchResumeAnchorMode;
}

interface ResolveWorkbenchResumeActionDescriptorParams {
  actionId: string | null;
  commandAction?: WorkbenchResumeCommandActionLike | null;
  lastPageId: PersistedWorkbenchState["lastPageId"];
  sessionTitle?: string | null;
  workspaceLabel?: string | null;
  pageLabel?: string | null;
  slotLabel?: string | null;
  reviewSurfaceLabel?: string | null;
  latestHandoffLabel?: string | null;
  observabilityLabel?: string | null;
}

const WORKBENCH_NATIVE_RESUME_ACTION_IDS = new Set<WorkbenchNativeResumeActionId>([
  "workbench-new-session",
  "workbench-resume-last-workspace",
  "workbench-restore-last-page",
  "workbench-restore-last-slot",
  "workbench-review-surface-focus",
  "workbench-review-surface-handoff",
  "workbench-review-surface-observability"
]);

export function isWorkbenchNativeResumeActionId(value: string | null | undefined): value is WorkbenchNativeResumeActionId {
  return Boolean(value && WORKBENCH_NATIVE_RESUME_ACTION_IDS.has(value as WorkbenchNativeResumeActionId));
}

export function resolveWorkbenchResumeSurfacePatch(
  actionId: string | null | undefined,
  fallback: Pick<StudioShellLayoutState, "rightRailTabId" | "bottomDockTabId">
): Pick<StudioShellLayoutState, "rightRailTabId" | "bottomDockTabId"> {
  switch (actionId) {
    case "command-open-trace-view":
    case "command-show-trace":
    case "workbench-restore-last-slot":
      return {
        rightRailTabId: "trace",
        bottomDockTabId: "focus"
      };
    case "command-inspect-boundary":
    case "workbench-restore-last-page":
      return {
        rightRailTabId: "inspector",
        bottomDockTabId: "focus"
      };
    case "command-open-review-view":
    case "command-open-windows-observability":
    case "workbench-resume-last-workspace":
    case "workbench-review-surface-focus":
    case "workbench-review-surface-handoff":
    case "workbench-review-surface-observability":
      return {
        rightRailTabId: "windows",
        bottomDockTabId: "windows"
      };
    default:
      return fallback;
  }
}

export function resolveWorkbenchResumeActionDescriptor(
  params: ResolveWorkbenchResumeActionDescriptorParams
): WorkbenchResumeActionDescriptor | null {
  const { actionId } = params;

  if (!actionId) {
    return null;
  }

  if (!isWorkbenchNativeResumeActionId(actionId)) {
    return params.commandAction
      ? {
          ...params.commandAction,
          kind: "command-action"
        }
      : null;
  }

  switch (actionId) {
    case "workbench-new-session":
      return {
        id: actionId,
        label: "Open Command Palette",
        description: "Open the command palette to start a new task or flow.",
        tone: "positive",
        kind: "command-palette"
      };
    case "workbench-resume-last-workspace":
      return {
        id: actionId,
        label: "Resume Last Workspace",
        description: params.sessionTitle ? `${params.sessionTitle} / restore the remembered workspace anchor.` : "Restore the remembered workspace anchor.",
        tone: "positive",
        kind: "restore-anchor",
        anchorMode: "workspace"
      };
    case "workbench-restore-last-page":
      return {
        id: actionId,
        label: "Restore Remembered Page",
        description: params.pageLabel ? `${params.pageLabel} / restore the remembered page inside the current workspace.` : "Restore the remembered page.",
        tone: "positive",
        kind: "restore-anchor",
        anchorMode: "page"
      };
    case "workbench-restore-last-slot":
      return {
        id: actionId,
        label: "Focus Last Focused Slot",
        description: params.slotLabel ? `${params.slotLabel} / restore the last focused slot with trace posture.` : "Restore the last focused slot with trace posture.",
        tone: "positive",
        kind: "restore-anchor",
        anchorMode: "slot"
      };
    case "workbench-review-surface-focus":
      return {
        id: actionId,
        label: "Focus Active Review Surface",
        description: params.reviewSurfaceLabel ? `${params.reviewSurfaceLabel} / keep the workbench anchored.` : "Restore the active review surface on the workbench.",
        tone: "neutral",
        kind: "review-surface-focus"
      };
    case "workbench-review-surface-handoff":
      return {
        id: actionId,
        label: "Restore Latest Handoff",
        description: params.latestHandoffLabel ?? "Restore the latest remembered handoff on the workbench.",
        tone: "positive",
        kind: "review-surface-handoff"
      };
    case "workbench-review-surface-observability":
      return {
        id: actionId,
        label: "Inspect Cross-window Observability",
        description: params.observabilityLabel ?? "Surface the current cross-window observability posture on the workbench.",
        tone: "neutral",
        kind: "review-surface-observability"
      };
    default:
      return null;
  }
}
