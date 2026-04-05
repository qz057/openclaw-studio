import { mockShellState, type CodexTaskSummary, type SessionSummary, type StudioApi, type StudioShellState } from "@openclaw/shared";

function cloneState(): StudioShellState {
  return JSON.parse(JSON.stringify(mockShellState)) as StudioShellState;
}

export function createMockRuntime(): StudioApi {
  return {
    async getShellState(): Promise<StudioShellState> {
      return cloneState();
    },
    async listSessions(): Promise<SessionSummary[]> {
      return cloneState().sessions;
    },
    async listCodexTasks(): Promise<CodexTaskSummary[]> {
      return cloneState().codex.tasks;
    }
  };
}
