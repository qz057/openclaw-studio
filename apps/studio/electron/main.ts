import path from "node:path";
import { app, BrowserWindow, ipcMain } from "electron";
import { createStudioRuntime } from "./runtime/studio-runtime";
import { studioChannels, studioHostBridgeSlotChannels } from "@openclaw/shared";

const runtime = createStudioRuntime();
const disableElectronSandbox = process.env.OPENCLAW_STUDIO_NO_SANDBOX === "1" || process.env.ELECTRON_DISABLE_SANDBOX === "1";

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

async function createMainWindow(): Promise<void> {
  const window = new BrowserWindow({
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
      sandbox: false
    }
  });

  window.once("ready-to-show", () => {
    window.show();
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  if (devServerUrl) {
    await window.loadURL(devServerUrl);
    window.webContents.openDevTools({ mode: "detach" });
    return;
  }

  const rendererEntry = getRendererEntry();

  try {
    await window.loadFile(rendererEntry);
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
  ipcMain.handle(studioChannels.hostExecutorState, () => runtime.getHostExecutorState());
  ipcMain.handle(studioChannels.hostBridgeState, () => runtime.getHostBridgeState());
  ipcMain.handle(studioChannels.hostPreviewHandoff, (_event, itemId, actionId) =>
    runtime.handoffHostPreview(String(itemId ?? ""), String(actionId ?? ""))
  );
  ipcMain.handle(studioChannels.runtimeItemDetail, (_event, itemId) => runtime.getRuntimeItemDetail(String(itemId ?? "")));
  ipcMain.handle(studioChannels.runtimeItemAction, (_event, itemId, actionId) =>
    runtime.runRuntimeItemAction(String(itemId ?? ""), String(actionId ?? ""))
  );

  for (const channel of Object.values(studioHostBridgeSlotChannels)) {
    ipcMain.handle(channel, (_event, handoff) => runtime.invokeHostBridgeSlot(channel, handoff ?? null));
  }
}

app.whenReady().then(async () => {
  registerIpcHandlers();
  await createMainWindow();

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
