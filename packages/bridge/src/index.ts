import type {
  StudioApi,
  StudioHostBridgeState,
  StudioHostPreviewHandoff,
  StudioRuntimeActionResult,
  StudioRuntimeDetail,
  StudioShellState
} from "@openclaw/shared";

declare global {
  interface Window {
    studio?: StudioApi;
  }
}

let fallbackApiPromise: Promise<StudioApi> | null = null;

async function loadFallbackApi(): Promise<StudioApi> {
  fallbackApiPromise ??= import("./fallback.js").then(({ createFallbackApi }) => createFallbackApi());

  return fallbackApiPromise;
}

export async function getStudioApi(): Promise<StudioApi> {
  if (typeof window !== "undefined" && window.studio) {
    return window.studio;
  }

  return loadFallbackApi();
}

export async function loadStudioSnapshot(): Promise<StudioShellState> {
  return (await getStudioApi()).getShellState();
}

export async function loadHostBridgeState(): Promise<StudioHostBridgeState> {
  return (await getStudioApi()).getHostBridgeState();
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
