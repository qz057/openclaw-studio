"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const electron_1 = require("electron");
const studio_runtime_1 = require("./runtime/studio-runtime");
const shared_1 = require("@openclaw/shared");
const runtime = (0, studio_runtime_1.createStudioRuntime)();
const disableElectronSandbox = process.env.OPENCLAW_STUDIO_NO_SANDBOX === "1" || process.env.ELECTRON_DISABLE_SANDBOX === "1";
if (process.platform === "linux") {
    electron_1.app.disableHardwareAcceleration();
    electron_1.app.commandLine.appendSwitch("disable-gpu");
    if (disableElectronSandbox) {
        electron_1.app.commandLine.appendSwitch("no-sandbox");
        electron_1.app.commandLine.appendSwitch("disable-setuid-sandbox");
    }
}
function getRendererEntry() {
    return node_path_1.default.join(__dirname, "..", "..", "dist-renderer", "index.html");
}
async function createMainWindow() {
    const window = new electron_1.BrowserWindow({
        width: 1520,
        height: 980,
        minWidth: 1200,
        minHeight: 760,
        backgroundColor: "#0b0f14",
        show: false,
        title: "OpenClaw Studio",
        webPreferences: {
            preload: node_path_1.default.join(__dirname, "preload.js"),
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`OpenClaw Studio failed to load renderer entry: ${rendererEntry}`);
        console.error(message);
        throw error;
    }
}
function registerIpcHandlers() {
    electron_1.ipcMain.handle(shared_1.studioChannels.shellState, () => runtime.getShellState());
    electron_1.ipcMain.handle(shared_1.studioChannels.sessions, () => runtime.listSessions());
    electron_1.ipcMain.handle(shared_1.studioChannels.codexTasks, () => runtime.listCodexTasks());
    electron_1.ipcMain.handle(shared_1.studioChannels.hostExecutorState, () => runtime.getHostExecutorState());
    electron_1.ipcMain.handle(shared_1.studioChannels.hostBridgeState, () => runtime.getHostBridgeState());
    electron_1.ipcMain.handle(shared_1.studioChannels.hostPreviewHandoff, (_event, itemId, actionId) => runtime.handoffHostPreview(String(itemId ?? ""), String(actionId ?? "")));
    electron_1.ipcMain.handle(shared_1.studioChannels.runtimeItemDetail, (_event, itemId) => runtime.getRuntimeItemDetail(String(itemId ?? "")));
    electron_1.ipcMain.handle(shared_1.studioChannels.runtimeItemAction, (_event, itemId, actionId) => runtime.runRuntimeItemAction(String(itemId ?? ""), String(actionId ?? "")));
    for (const channel of Object.values(shared_1.studioHostBridgeSlotChannels)) {
        electron_1.ipcMain.handle(channel, (_event, handoff) => runtime.invokeHostBridgeSlot(channel, handoff ?? null));
    }
}
electron_1.app.whenReady().then(async () => {
    registerIpcHandlers();
    await createMainWindow();
    electron_1.app.on("activate", async () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            await createMainWindow();
        }
    });
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
