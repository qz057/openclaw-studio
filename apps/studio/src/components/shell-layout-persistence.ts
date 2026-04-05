import type { StudioShellLayoutState, StudioShellState } from "@openclaw/shared";

function readPersistedLayoutCandidate(storageKey: string): Partial<StudioShellLayoutState> | null {
  try {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as { state?: Partial<StudioShellLayoutState> } | Partial<StudioShellLayoutState> | null;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return ("state" in parsed && parsed.state && typeof parsed.state === "object" ? parsed.state : parsed) as Partial<StudioShellLayoutState>;
  } catch {
    return null;
  }
}

function includesValue<T extends string>(values: T[], value: string | undefined): value is T {
  return Boolean(value) && values.includes(value as T);
}

export function areShellLayoutStatesEqual(left: StudioShellLayoutState | null, right: StudioShellLayoutState | null): boolean {
  if (!left || !right) {
    return left === right;
  }

  return (
    left.rightRailVisible === right.rightRailVisible &&
    left.bottomDockVisible === right.bottomDockVisible &&
    left.compactMode === right.compactMode &&
    left.rightRailTabId === right.rightRailTabId &&
    left.bottomDockTabId === right.bottomDockTabId &&
    left.workspaceViewId === right.workspaceViewId
  );
}

export function resolvePersistedShellLayoutState(
  shellState: StudioShellState,
  preferred?: Partial<StudioShellLayoutState> | null
): StudioShellLayoutState {
  const candidate = preferred ?? readPersistedLayoutCandidate(shellState.layout.persistence.storageKey);
  const rightRailTabIds = shellState.layout.rightRailTabs.map((tab) => tab.id);
  const bottomDockTabIds = shellState.layout.bottomDockTabs.map((tab) => tab.id);
  const workspaceViewIds = shellState.windowing.views.map((view) => view.id);

  return {
    rightRailVisible:
      typeof candidate?.rightRailVisible === "boolean" ? candidate.rightRailVisible : shellState.layout.defaultState.rightRailVisible,
    bottomDockVisible:
      typeof candidate?.bottomDockVisible === "boolean" ? candidate.bottomDockVisible : shellState.layout.defaultState.bottomDockVisible,
    compactMode: typeof candidate?.compactMode === "boolean" ? candidate.compactMode : shellState.layout.defaultState.compactMode,
    rightRailTabId: includesValue(rightRailTabIds, candidate?.rightRailTabId) ? candidate.rightRailTabId : shellState.layout.defaultState.rightRailTabId,
    bottomDockTabId: includesValue(bottomDockTabIds, candidate?.bottomDockTabId)
      ? candidate.bottomDockTabId
      : shellState.layout.defaultState.bottomDockTabId,
    workspaceViewId: includesValue(workspaceViewIds, candidate?.workspaceViewId)
      ? candidate.workspaceViewId
      : shellState.layout.defaultState.workspaceViewId
  };
}

export function writePersistedShellLayoutState(shellState: StudioShellState, layoutState: StudioShellLayoutState) {
  try {
    const persistedState: Partial<StudioShellLayoutState> = {};

    if (shellState.layout.persistence.persistedFields.includes("rightRailVisible")) {
      persistedState.rightRailVisible = layoutState.rightRailVisible;
    }

    if (shellState.layout.persistence.persistedFields.includes("bottomDockVisible")) {
      persistedState.bottomDockVisible = layoutState.bottomDockVisible;
    }

    if (shellState.layout.persistence.persistedFields.includes("compactMode")) {
      persistedState.compactMode = layoutState.compactMode;
    }

    if (shellState.layout.persistence.persistedFields.includes("rightRailTabId")) {
      persistedState.rightRailTabId = layoutState.rightRailTabId;
    }

    if (shellState.layout.persistence.persistedFields.includes("bottomDockTabId")) {
      persistedState.bottomDockTabId = layoutState.bottomDockTabId;
    }

    if (shellState.layout.persistence.persistedFields.includes("workspaceViewId")) {
      persistedState.workspaceViewId = layoutState.workspaceViewId;
    }

    window.localStorage.setItem(
      shellState.layout.persistence.storageKey,
      JSON.stringify({
        version: shellState.layout.persistence.version,
        state: persistedState
      })
    );
  } catch {
    // Ignore storage failures so the shell stays usable in restricted environments.
  }
}
