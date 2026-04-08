import type { StudioPageId, StudioShellLayoutState } from "@openclaw/shared";

export type WorkbenchSessionFilter = "all" | "active" | "waiting" | "complete";

export interface PersistedWorkbenchState {
  lastSessionId: string | null;
  sessionFilter: WorkbenchSessionFilter;
  lastActionId: string | null;
  lastPageId: StudioPageId | null;
  lastWorkspaceViewId: StudioShellLayoutState["workspaceViewId"] | null;
  lastFocusedSlotId: string | null;
}

const WORKBENCH_STORAGE_KEY = "openclaw-studio.workbench-state.v1";

const DEFAULT_WORKBENCH_STATE: PersistedWorkbenchState = {
  lastSessionId: null,
  sessionFilter: "all",
  lastActionId: null,
  lastPageId: null,
  lastWorkspaceViewId: null,
  lastFocusedSlotId: null
};

function isSessionFilter(value: string | undefined): value is WorkbenchSessionFilter {
  return value === "all" || value === "active" || value === "waiting" || value === "complete";
}

export function readPersistedWorkbenchState(): PersistedWorkbenchState {
  try {
    const rawValue = window.localStorage.getItem(WORKBENCH_STORAGE_KEY);

    if (!rawValue) {
      return DEFAULT_WORKBENCH_STATE;
    }

    const parsed = JSON.parse(rawValue) as Partial<PersistedWorkbenchState> | null;

    if (!parsed || typeof parsed !== "object") {
      return DEFAULT_WORKBENCH_STATE;
    }

    return {
      lastSessionId: typeof parsed.lastSessionId === "string" ? parsed.lastSessionId : null,
      sessionFilter: isSessionFilter(parsed.sessionFilter) ? parsed.sessionFilter : DEFAULT_WORKBENCH_STATE.sessionFilter,
      lastActionId: typeof parsed.lastActionId === "string" ? parsed.lastActionId : null,
      lastPageId: typeof parsed.lastPageId === "string" ? (parsed.lastPageId as StudioPageId) : null,
      lastWorkspaceViewId: typeof parsed.lastWorkspaceViewId === "string" ? parsed.lastWorkspaceViewId : null,
      lastFocusedSlotId: typeof parsed.lastFocusedSlotId === "string" ? parsed.lastFocusedSlotId : null
    };
  } catch {
    return DEFAULT_WORKBENCH_STATE;
  }
}

export function writePersistedWorkbenchState(nextState: Partial<PersistedWorkbenchState>) {
  try {
    const currentState = readPersistedWorkbenchState();
    window.localStorage.setItem(
      WORKBENCH_STORAGE_KEY,
      JSON.stringify({
        ...currentState,
        ...nextState
      })
    );
  } catch {
    // Ignore persistence errors so the shell stays usable in restricted environments.
  }
}
