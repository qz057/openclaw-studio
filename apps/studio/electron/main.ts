import path from "node:path";
import { pathToFileURL } from "node:url";
import { app, BrowserWindow, ipcMain, session } from "electron";
import { createStudioRuntime } from "./runtime/studio-runtime";
import { loadClaudeSessionMessages, loadClaudeSnapshot } from "./runtime/probes/claude-sessions";
import { connectHermesRuntime, createHermesSessionFromWSL, disconnectHermesRuntime, loadHermesSessionMessages, loadHermesSnapshot, loadHermesState, sendHermesMessage } from "./runtime/probes/hermes";
import { createOpenClawChatSession, loadOpenClawChatState, sendOpenClawChatTurn } from "./runtime/probes/openclaw-chat";
import { loadDeviceBootstrapState } from "./runtime/probes/device-bootstrap";
import {
  loadHermesGatewayServiceState,
  loadOpenClawGatewayServiceState,
  startHermesGatewayService,
  startOpenClawGatewayService,
  stopHermesGatewayService,
  stopOpenClawGatewayService
} from "./runtime/probes/gateway-services";
import { loadHermesModelCatalog, loadOpenClawModelCatalog, setHermesModel, setOpenClawModel } from "./runtime/probes/model-config";
import { studioChannels, studioHostBridgeSlotChannels } from "@openclaw/shared";
import type { StudioHermesEvent, PerformanceAlert } from "@openclaw/shared";
import { getPerformanceMonitor } from "./runtime/performance-monitor";

function isEpipeError(cause: unknown): boolean {
  return typeof cause === "object" && cause !== null && "code" in cause && (cause as { code?: unknown }).code === "EPIPE";
}

function installSafeConsoleForClosedPipes(): void {
  for (const method of ["log", "info", "warn", "error"] as const) {
    const original = console[method].bind(console);
    console[method] = (...args: unknown[]) => {
      try {
        original(...args);
      } catch (cause) {
        if (!isEpipeError(cause)) {
          throw cause;
        }
      }
    };
  }

  process.stdout.on("error", (cause) => {
    if (!isEpipeError(cause)) {
      throw cause;
    }
  });
  process.stderr.on("error", (cause) => {
    if (!isEpipeError(cause)) {
      throw cause;
    }
  });
}

installSafeConsoleForClosedPipes();

const runtime = createStudioRuntime();
const disableElectronSandbox = process.env.OPENCLAW_STUDIO_NO_SANDBOX === "1" || process.env.ELECTRON_DISABLE_SANDBOX === "1";
const enableRendererSandbox = !disableElectronSandbox && process.env.OPENCLAW_STUDIO_RENDERER_SANDBOX !== "0";
const devServerUrl = process.env.VITE_DEV_SERVER_URL;
const userDataDir = process.env.OPENCLAW_STUDIO_USER_DATA_DIR?.trim();
let mainWindow: BrowserWindow | null = null;
let hasSetupHermesEventForwarding = false;
let hasSetupPerformanceAlertForwarding = false;

if (userDataDir) {
  app.setPath("userData", userDataDir);
  app.setPath("sessionData", userDataDir);
  app.commandLine.appendSwitch("user-data-dir", userDataDir);
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
}

interface HermesEventSubscriberEntry {
  sender: Electron.WebContents;
  refCount: number;
}

interface PerformanceAlertSubscriberEntry {
  sender: Electron.WebContents;
  refCount: number;
}

// Hermes 事件订阅管理（按 webContents.id 做引用计数）
const hermesEventSubscribers = new Map<number, HermesEventSubscriberEntry>();
const performanceAlertSubscribers = new Map<number, PerformanceAlertSubscriberEntry>();

if (process.platform === "linux") {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch("disable-gpu");

  if (disableElectronSandbox) {
    app.commandLine.appendSwitch("no-sandbox");
    app.commandLine.appendSwitch("disable-setuid-sandbox");
  }
}

function getRendererEntry(): string {
  return path.join(__dirname, "..", "..", "dist-renderer", "index.html");
}

function isAllowedRendererNavigation(url: string): boolean {
  try {
    if (devServerUrl) {
      return new URL(url).origin === new URL(devServerUrl).origin;
    }

    const targetUrl = new URL(url);
    const rendererFileUrl = pathToFileURL(getRendererEntry());
    return targetUrl.protocol === "file:" && targetUrl.pathname === rendererFileUrl.pathname;
  } catch {
    return false;
  }
}

function hardenWindow(window: BrowserWindow): void {
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  window.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedRendererNavigation(url)) {
      event.preventDefault();
    }
  });
}

function configureSessionSecurity(): void {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
}

async function createMainWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1520,
    height: 980,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: "#0b0f14",
    show: false,
    title: "OpenClaw Studio",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: enableRendererSandbox
    }
  });

  const window = mainWindow;
  hardenWindow(window);

  window.once("closed", () => {
    if (mainWindow === window) {
      mainWindow = null;
    }
  });

  window.once("ready-to-show", () => {
    window.show();
  });

  if (devServerUrl) {
    await window.loadURL(devServerUrl);
    window.webContents.openDevTools({ mode: "detach" });
    return;
  }

  const rendererEntry = getRendererEntry();

  try {
    await window.loadURL(pathToFileURL(rendererEntry).href);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`OpenClaw Studio failed to load renderer entry: ${rendererEntry}`);
    console.error(message);
    throw error;
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle(studioChannels.shellState, () => runtime.getShellState());
  ipcMain.handle(studioChannels.sessions, () => runtime.listSessions());
  ipcMain.handle(studioChannels.codexTasks, () => runtime.listCodexTasks());
  ipcMain.handle(studioChannels.claudeSnapshot, () => loadClaudeSnapshot());
  ipcMain.handle(studioChannels.claudeSessionMessages, (_event, sessionId) => loadClaudeSessionMessages(String(sessionId ?? "")));
  ipcMain.handle(studioChannels.openclawChatState, (_event, sessionId) => loadOpenClawChatState(typeof sessionId === "string" ? sessionId : null));
  ipcMain.handle(studioChannels.openclawChatTurn, (_event, prompt, sessionId) =>
    sendOpenClawChatTurn(String(prompt ?? ""), typeof sessionId === "string" ? sessionId : null)
  );
  ipcMain.handle(studioChannels.openclawChatCreateSession, () => createOpenClawChatSession());
  ipcMain.handle(studioChannels.openclawGatewayState, () => loadOpenClawGatewayServiceState());
  ipcMain.handle(studioChannels.openclawGatewayStart, () => startOpenClawGatewayService());
  ipcMain.handle(studioChannels.openclawGatewayStop, () => stopOpenClawGatewayService());
  ipcMain.handle(studioChannels.openclawChatModels, () => loadOpenClawModelCatalog());
  ipcMain.handle(studioChannels.openclawChatSetModel, (_event, modelId) => setOpenClawModel(String(modelId ?? "")));
  ipcMain.handle(studioChannels.hermesState, () => loadHermesState());
  ipcMain.handle(studioChannels.hermesSnapshot, () => loadHermesSnapshot());
  ipcMain.handle(studioChannels.hermesSessionMessages, (_event, sessionId) => loadHermesSessionMessages(String(sessionId ?? "")));
  ipcMain.handle(studioChannels.hermesCreateSession, (_event, modelId) => createHermesSessionFromWSL(typeof modelId === "string" ? modelId : null));
  ipcMain.handle(studioChannels.hermesGatewayState, () => loadHermesGatewayServiceState());
  ipcMain.handle(studioChannels.hermesGatewayStart, () => startHermesGatewayService());
  ipcMain.handle(studioChannels.hermesGatewayStop, () => stopHermesGatewayService());
  ipcMain.handle(studioChannels.hermesConnect, () => connectHermesRuntime());
  ipcMain.handle(studioChannels.hermesDisconnect, () => disconnectHermesRuntime());
  ipcMain.handle(studioChannels.hermesSendMessage, (_event, sessionId, content) =>
    sendHermesMessage(String(sessionId ?? ""), String(content ?? ""))
  );
  ipcMain.handle(studioChannels.hermesModels, () => loadHermesModelCatalog());
  ipcMain.handle(studioChannels.hermesSetModel, (_event, modelId) => setHermesModel(String(modelId ?? "")));

  // Hermes 事件订阅
  ipcMain.handle(studioChannels.hermesSubscribe, (event) => {
    const webContentsId = event.sender.id;
    const existing = hermesEventSubscribers.get(webContentsId);

    if (existing) {
      existing.refCount += 1;
      return true;
    }

    hermesEventSubscribers.set(webContentsId, {
      sender: event.sender,
      refCount: 1
    });

    event.sender.once("destroyed", () => {
      hermesEventSubscribers.delete(webContentsId);
    });

    // 设置网关事件监听器
    void setupHermesEventForwarding();

    return true;
  });

  ipcMain.handle(studioChannels.hermesUnsubscribe, (event) => {
    const webContentsId = event.sender.id;
    const existing = hermesEventSubscribers.get(webContentsId);

    if (!existing) {
      return true;
    }

    if (existing.refCount <= 1) {
      hermesEventSubscribers.delete(webContentsId);
      return true;
    }

    existing.refCount -= 1;

    return true;
  });

  ipcMain.handle(studioChannels.performanceSubscribe, (event) => {
    const webContentsId = event.sender.id;
    const existing = performanceAlertSubscribers.get(webContentsId);

    if (existing) {
      existing.refCount += 1;
      return true;
    }

    performanceAlertSubscribers.set(webContentsId, {
      sender: event.sender,
      refCount: 1
    });

    event.sender.once("destroyed", () => {
      performanceAlertSubscribers.delete(webContentsId);
      shutdownPerformanceAlertForwardingIfUnused();
    });

    void setupPerformanceAlertForwarding();
    void startPerformanceMonitoring();

    return true;
  });

  ipcMain.handle(studioChannels.performanceUnsubscribe, (event) => {
    const webContentsId = event.sender.id;
    const existing = performanceAlertSubscribers.get(webContentsId);

    if (!existing) {
      return true;
    }

    if (existing.refCount <= 1) {
      performanceAlertSubscribers.delete(webContentsId);
      shutdownPerformanceAlertForwardingIfUnused();
      return true;
    }

    existing.refCount -= 1;
    return true;
  });

  ipcMain.handle(studioChannels.hostExecutorState, () => runtime.getHostExecutorState());
  ipcMain.handle(studioChannels.hostBridgeState, () => runtime.getHostBridgeState());
  ipcMain.handle(studioChannels.hostPreviewHandoff, (_event, itemId, actionId) =>
    runtime.handoffHostPreview(String(itemId ?? ""), String(actionId ?? ""))
  );
  ipcMain.handle(studioChannels.runtimeItemDetail, (_event, itemId) => runtime.getRuntimeItemDetail(String(itemId ?? "")));
  ipcMain.handle(studioChannels.runtimeItemAction, (_event, itemId, actionId) =>
    runtime.runRuntimeItemAction(String(itemId ?? ""), String(actionId ?? ""))
  );
  ipcMain.handle(studioChannels.deviceBootstrapState, () => loadDeviceBootstrapState());

  // 性能监控
  ipcMain.handle(studioChannels.performanceMetrics, () => {
    const monitor = getPerformanceMonitor();
    return monitor.getMetrics();
  });

  // WSL Hermes 数据加载
  ipcMain.handle(studioChannels.hermesGetSessions, async () => {
    const { loadHermesSessionsFromWSL } = await import("./runtime/probes/hermes");
    return loadHermesSessionsFromWSL();
  });

  ipcMain.handle(studioChannels.hermesGetMessages, async (_event, sessionId) => {
    const { loadHermesSessionFromWSL } = await import("./runtime/probes/hermes");
    return loadHermesSessionFromWSL(String(sessionId ?? ""));
  });

  for (const channel of Object.values(studioHostBridgeSlotChannels)) {
    ipcMain.handle(channel, (_event, handoff) => runtime.invokeHostBridgeSlot(channel, handoff ?? null));
  }
}

/**
 * 设置 Hermes 事件转发
 */
async function setupHermesEventForwarding(): Promise<void> {
  if (hasSetupHermesEventForwarding) {
    return;
  }

  const { getHermesGatewayManager } = await import("./runtime/hermes-gateway");
  const manager = getHermesGatewayManager();

  // 监听网关事件并转发到所有订阅的渲染进程
  const forwardEvent = (event: StudioHermesEvent) => {
    broadcastHermesEvent(event);
  };

  manager.on("event", forwardEvent);

  manager.on("connected", () => {
    const event: StudioHermesEvent = {
      id: `hermes-connected-${Date.now()}`,
      type: "gateway",
      title: "Hermes 已连接",
      detail: "成功连接到 Hermes 网关",
      timestamp: new Date().toISOString(),
      level: "info"
    };
    broadcastHermesEvent(event);
  });

  manager.on("disconnected", () => {
    const event: StudioHermesEvent = {
      id: `hermes-disconnected-${Date.now()}`,
      type: "gateway",
      title: "Hermes 已断开",
      detail: "与 Hermes 网关的连接已断开",
      timestamp: new Date().toISOString(),
      level: "warning"
    };
    broadcastHermesEvent(event);
  });

  manager.on("error", (error: Error) => {
    const event: StudioHermesEvent = {
      id: `hermes-error-${Date.now()}`,
      type: "gateway",
      title: "Hermes 连接错误",
      detail: error.message,
      timestamp: new Date().toISOString(),
      level: "error"
    };
    broadcastHermesEvent(event);
  });
  hasSetupHermesEventForwarding = true;
}

/**
 * 设置性能告警转发
 */
async function setupPerformanceAlertForwarding(): Promise<void> {
  if (hasSetupPerformanceAlertForwarding) {
    return;
  }

  const monitor = getPerformanceMonitor();

  const forwardAlert = (alert: PerformanceAlert) => {
    broadcastPerformanceAlert(alert);
  };

  monitor.on("alert", forwardAlert);
  hasSetupPerformanceAlertForwarding = true;
}

function startPerformanceMonitoring(): void {
  const monitor = getPerformanceMonitor();
  monitor.start();
}

function stopPerformanceMonitoring(): void {
  const monitor = getPerformanceMonitor();
  monitor.stop();
}

function shutdownPerformanceAlertForwardingIfUnused(): void {
  if (performanceAlertSubscribers.size > 0) {
    return;
  }

  stopPerformanceMonitoring();
}

/**
 * 广播性能告警到所有订阅的渲染进程
 */
function broadcastPerformanceAlert(alert: PerformanceAlert): void {
  if (performanceAlertSubscribers.size === 0) {
    return;
  }

  for (const [webContentsId, entry] of performanceAlertSubscribers.entries()) {
    const webContents = entry.sender;
    if (!webContents || webContents.isDestroyed()) {
      performanceAlertSubscribers.delete(webContentsId);
      continue;
    }

    try {
      webContents.send(studioChannels.performanceAlert, alert);
    } catch {
      performanceAlertSubscribers.delete(webContentsId);
    }
  }

  shutdownPerformanceAlertForwardingIfUnused();
}

/**
 * 广播 Hermes 事件到所有订阅的渲染进程
 */
function broadcastHermesEvent(event: StudioHermesEvent): void {
  if (hermesEventSubscribers.size === 0) {
    return;
  }

  for (const [webContentsId, entry] of hermesEventSubscribers.entries()) {
    const webContents = entry.sender;
    if (!webContents || webContents.isDestroyed()) {
      hermesEventSubscribers.delete(webContentsId);
      continue;
    }

    try {
      webContents.send(studioChannels.hermesEvent, event);
    } catch {
      hermesEventSubscribers.delete(webContentsId);
    }
  }
}

app.on("second-instance", () => {
  if (!mainWindow) {
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }

  mainWindow.focus();
});

app.whenReady().then(async () => {
  configureSessionSecurity();
  registerIpcHandlers();
  await createMainWindow();

  // 设置 Hermes 事件转发
  await setupHermesEventForwarding();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
