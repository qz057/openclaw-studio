import path from "node:path";
import { app, BrowserWindow, ipcMain } from "electron";
import { createStudioRuntime } from "./runtime/studio-runtime";
import { studioChannels } from "@openclaw/shared";

const runtime = createStudioRuntime();

function getRendererEntry(): string {
  return path.join(__dirname, "..", "dist-renderer", "index.html");
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
      nodeIntegration: false
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

  await window.loadFile(getRendererEntry());
}

function registerIpcHandlers(): void {
  ipcMain.handle(studioChannels.shellState, () => runtime.getShellState());
  ipcMain.handle(studioChannels.sessions, () => runtime.listSessions());
  ipcMain.handle(studioChannels.codexTasks, () => runtime.listCodexTasks());
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
