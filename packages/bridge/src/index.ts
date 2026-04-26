import type {
  CodexTaskSummary,
  SessionSummary,
  StudioApi,
  StudioClaudeMessage,
  StudioClaudeSnapshot,
  StudioGatewayServiceMutationResult,
  StudioGatewayServiceState,
  StudioHermesMessage,
  StudioHermesState,
  StudioOpenClawChatSessionRef,
  StudioModelCatalog,
  StudioModelMutationResult,
  StudioHermesSnapshot,
  StudioHermesConnectResult,
  StudioHermesDisconnectResult,
  StudioHermesSendMessageResult,
  StudioHermesLoadSessionsResult,
  StudioHermesLoadSessionResult,
  StudioHermesEvent,
  StudioHostExecutorState,
  StudioOpenClawChatState,
  StudioOpenClawChatTurnResult,
  StudioHostBridgeState,
  StudioHostPreviewHandoff,
  StudioRuntimeActionResult,
  StudioRuntimeDetail,
  StudioShellState,
  PerformanceMetrics,
  PerformanceAlert
} from "@openclaw/shared";

type StudioReadApi = Pick<
  StudioApi,
  | "getShellState"
  | "listSessions"
  | "listCodexTasks"
  | "getClaudeSnapshot"
  | "getClaudeSessionMessages"
  | "getOpenClawChatState"
  | "getOpenClawGatewayServiceState"
  | "getOpenClawModelCatalog"
  | "getHermesState"
  | "getHermesSnapshot"
  | "getHermesSessionMessages"
  | "getHermesGatewayServiceState"
  | "getHermesModelCatalog"
  | "loadHermesSessions"
  | "loadHermesSession"
  | "getHermesSessions"
  | "getHermesMessages"
  | "getHostExecutorState"
  | "getHostBridgeState"
  | "getRuntimeItemDetail"
  | "getPerformanceMetrics"
  | "subscribePerformanceAlerts"
>;

type StudioSessionApi = Pick<
  StudioApi,
  | "sendOpenClawChatTurn"
  | "createOpenClawChatSession"
  | "createHermesSession"
  | "connectHermes"
  | "disconnectHermes"
  | "sendHermesMessage"
  | "subscribeHermesEvents"
>;

type StudioGatewayApi = Pick<
  StudioApi,
  | "startOpenClawGatewayService"
  | "stopOpenClawGatewayService"
  | "setOpenClawModel"
  | "startHermesGatewayService"
  | "stopHermesGatewayService"
  | "setHermesModel"
>;

type StudioRuntimeApi = Pick<StudioApi, "handoffHostPreview" | "runRuntimeItemAction">;

declare global {
  interface Window {
    studioRead?: StudioReadApi;
    studioSession?: StudioSessionApi;
    studioGateway?: StudioGatewayApi;
    studioRuntime?: StudioRuntimeApi;
  }
}

let fallbackApiPromise: Promise<StudioApi> | null = null;

async function loadFallbackApi(): Promise<StudioApi> {
  fallbackApiPromise ??= import("./fallback.js").then(({ createFallbackApi }) => createFallbackApi());

  return fallbackApiPromise;
}

function loadNamespacedStudioApi(): StudioApi | null {
  if (typeof window === "undefined") {
    return null;
  }

  const { studioRead, studioSession, studioGateway, studioRuntime } = window;
  if (!studioRead || !studioSession || !studioGateway || !studioRuntime) {
    return null;
  }

  const api: StudioApi = {
    ...studioRead,
    ...studioSession,
    ...studioGateway,
    ...studioRuntime
  };

  return api;
}

export async function getStudioApi(): Promise<StudioApi> {
  const namespacedApi = loadNamespacedStudioApi();
  if (namespacedApi) {
    return namespacedApi;
  }

  return loadFallbackApi();
}

export async function loadStudioSnapshot(): Promise<StudioShellState> {
  return (await getStudioApi()).getShellState();
}

export async function listStudioSessions(): Promise<SessionSummary[]> {
  return (await getStudioApi()).listSessions();
}

export async function listCodexTasks(): Promise<CodexTaskSummary[]> {
  return (await getStudioApi()).listCodexTasks();
}

export async function loadClaudeSnapshot(): Promise<StudioClaudeSnapshot> {
  return (await getStudioApi()).getClaudeSnapshot();
}

export async function loadClaudeSessionMessages(sessionId: string): Promise<StudioClaudeMessage[]> {
  return (await getStudioApi()).getClaudeSessionMessages(sessionId);
}

export async function loadHostBridgeState(): Promise<StudioHostBridgeState> {
  return (await getStudioApi()).getHostBridgeState();
}

export async function loadHostExecutorState(): Promise<StudioHostExecutorState> {
  return (await getStudioApi()).getHostExecutorState();
}

export async function loadOpenClawChatState(sessionId?: string | null): Promise<StudioOpenClawChatState> {
  return (await getStudioApi()).getOpenClawChatState(sessionId);
}

export async function sendOpenClawChatTurn(prompt: string, sessionId?: string | null): Promise<StudioOpenClawChatTurnResult> {
  return (await getStudioApi()).sendOpenClawChatTurn(prompt, sessionId);
}

export async function createOpenClawChatSession(): Promise<StudioOpenClawChatSessionRef> {
  return (await getStudioApi()).createOpenClawChatSession();
}

export async function loadOpenClawGatewayServiceState(): Promise<StudioGatewayServiceState> {
  return (await getStudioApi()).getOpenClawGatewayServiceState();
}

export async function startOpenClawGatewayService(): Promise<StudioGatewayServiceMutationResult> {
  return (await getStudioApi()).startOpenClawGatewayService();
}

export async function stopOpenClawGatewayService(): Promise<StudioGatewayServiceMutationResult> {
  return (await getStudioApi()).stopOpenClawGatewayService();
}

export async function loadOpenClawModelCatalog(): Promise<StudioModelCatalog> {
  return (await getStudioApi()).getOpenClawModelCatalog();
}

export async function setOpenClawModel(modelId: string): Promise<StudioModelMutationResult> {
  return (await getStudioApi()).setOpenClawModel(modelId);
}

export async function loadHermesSnapshot(): Promise<StudioHermesSnapshot> {
  return (await getStudioApi()).getHermesSnapshot();
}

export async function loadHermesState(): Promise<StudioHermesState> {
  return (await getStudioApi()).getHermesState();
}

export async function loadHermesSessionMessages(sessionId: string): Promise<StudioHermesMessage[]> {
  return (await getStudioApi()).getHermesSessionMessages(sessionId);
}

export async function handoffHostPreview(itemId: string, actionId: string): Promise<StudioHostPreviewHandoff | null> {
  return (await getStudioApi()).handoffHostPreview(itemId, actionId);
}

export async function loadRuntimeItemDetail(itemId: string): Promise<StudioRuntimeDetail | null> {
  return (await getStudioApi()).getRuntimeItemDetail(itemId);
}

export async function loadRuntimeItemAction(itemId: string, actionId: string): Promise<StudioRuntimeActionResult | null> {
  return (await getStudioApi()).runRuntimeItemAction(itemId, actionId);
}

export async function connectHermes(): Promise<StudioHermesConnectResult> {
  return (await getStudioApi()).connectHermes();
}

export async function disconnectHermes(): Promise<StudioHermesDisconnectResult> {
  return (await getStudioApi()).disconnectHermes();
}

export async function sendHermesMessage(sessionId: string, content: string): Promise<StudioHermesSendMessageResult> {
  return (await getStudioApi()).sendHermesMessage(sessionId, content);
}

export async function createHermesSession(modelId?: string | null) {
  return (await getStudioApi()).createHermesSession(modelId);
}

export async function loadHermesGatewayServiceState(): Promise<StudioGatewayServiceState> {
  return (await getStudioApi()).getHermesGatewayServiceState();
}

export async function startHermesGatewayService(): Promise<StudioGatewayServiceMutationResult> {
  return (await getStudioApi()).startHermesGatewayService();
}

export async function stopHermesGatewayService(): Promise<StudioGatewayServiceMutationResult> {
  return (await getStudioApi()).stopHermesGatewayService();
}

export async function loadHermesModelCatalog(): Promise<StudioModelCatalog> {
  return (await getStudioApi()).getHermesModelCatalog();
}

export async function setHermesModel(modelId: string): Promise<StudioModelMutationResult> {
  return (await getStudioApi()).setHermesModel(modelId);
}

export async function subscribeToHermesEvents(
  listener: (event: StudioHermesEvent) => void
): Promise<() => void> {
  return (await getStudioApi()).subscribeHermesEvents(listener);
}

export async function loadHermesSessions(): Promise<StudioHermesLoadSessionsResult> {
  return (await getStudioApi()).loadHermesSessions();
}

export async function loadHermesSession(sessionId: string): Promise<StudioHermesLoadSessionResult> {
  return (await getStudioApi()).loadHermesSession(sessionId);
}

export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  return (await getStudioApi()).getPerformanceMetrics();
}

export async function subscribeToPerformanceAlerts(
  listener: (alert: PerformanceAlert) => void
): Promise<() => void> {
  return (await getStudioApi()).subscribePerformanceAlerts(listener);
}

export async function getHermesSessions(): Promise<StudioHermesLoadSessionsResult> {
  return (await getStudioApi()).getHermesSessions();
}

export async function getHermesMessages(sessionId: string): Promise<StudioHermesLoadSessionResult> {
  return (await getStudioApi()).getHermesMessages(sessionId);
}
