import { contextBridge, ipcRenderer } from "electron";
import { studioChannels, type CodexTaskSummary, type SessionSummary, type StudioApi, type StudioShellState } from "@openclaw/shared";

const studioApi: StudioApi = {
  async getShellState() {
    return ipcRenderer.invoke<StudioShellState>(studioChannels.shellState);
  },
  async listSessions() {
    return ipcRenderer.invoke<SessionSummary[]>(studioChannels.sessions);
  },
  async listCodexTasks() {
    return ipcRenderer.invoke<CodexTaskSummary[]>(studioChannels.codexTasks);
  }
};

contextBridge.exposeInMainWorld("studio", studioApi);
