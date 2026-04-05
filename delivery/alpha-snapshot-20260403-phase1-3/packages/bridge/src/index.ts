import { mockShellState, type CodexTaskSummary, type SessionSummary, type StudioApi, type StudioShellState } from "@openclaw/shared";

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
