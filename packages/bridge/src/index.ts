import {
  mockShellState,
  type CodexTaskSummary,
  type SessionSummary,
  type StudioApi,
  type StudioHostBridgeState,
  type StudioHostExecutorState,
  type StudioHostPreviewHandoff,
  type StudioRuntimeActionResult,
  type StudioRuntimeDetail,
  type StudioShellState
} from "@openclaw/shared";

declare global {
  interface Window {
    studio?: StudioApi;
  }
}

const fallbackApi: StudioApi = {
  async getShellState(): Promise<StudioShellState> {
    return mockShellState;
  },
  async listSessions(): Promise<SessionSummary[]> {
    return mockShellState.sessions;
  },
  async listCodexTasks(): Promise<CodexTaskSummary[]> {
    return mockShellState.codex.tasks;
  },
  async getHostExecutorState(): Promise<StudioHostExecutorState> {
    return mockShellState.boundary.hostExecutor;
  },
  async getHostBridgeState(): Promise<StudioHostBridgeState> {
    return mockShellState.boundary.hostExecutor.bridge;
  },
  async handoffHostPreview(): Promise<StudioHostPreviewHandoff | null> {
    return null;
  },
  async getRuntimeItemDetail(): Promise<StudioRuntimeDetail | null> {
    return null;
  },
  async runRuntimeItemAction(): Promise<StudioRuntimeActionResult | null> {
    return null;
  }
};

export function getStudioApi(): StudioApi {
  if (typeof window === "undefined") {
    return fallbackApi;
  }

  return window.studio ?? fallbackApi;
}

export async function loadStudioSnapshot(): Promise<StudioShellState> {
  return getStudioApi().getShellState();
}

export async function loadHostBridgeState(): Promise<StudioHostBridgeState> {
  return getStudioApi().getHostBridgeState();
}

export async function handoffHostPreview(itemId: string, actionId: string): Promise<StudioHostPreviewHandoff | null> {
  return getStudioApi().handoffHostPreview(itemId, actionId);
}

export async function loadRuntimeItemDetail(itemId: string): Promise<StudioRuntimeDetail | null> {
  return getStudioApi().getRuntimeItemDetail(itemId);
}

export async function loadRuntimeItemAction(itemId: string, actionId: string): Promise<StudioRuntimeActionResult | null> {
  return getStudioApi().runRuntimeItemAction(itemId, actionId);
}
