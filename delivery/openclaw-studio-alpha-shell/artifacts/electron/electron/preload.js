"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const shared_1 = require("@openclaw/shared");
const studioApi = {
    getShellState() {
        return electron_1.ipcRenderer.invoke(shared_1.studioChannels.shellState);
    },
    listSessions() {
        return electron_1.ipcRenderer.invoke(shared_1.studioChannels.sessions);
    },
    listCodexTasks() {
        return electron_1.ipcRenderer.invoke(shared_1.studioChannels.codexTasks);
    },
    getHostExecutorState() {
        return electron_1.ipcRenderer.invoke(shared_1.studioChannels.hostExecutorState);
    },
    getHostBridgeState() {
        return electron_1.ipcRenderer.invoke(shared_1.studioChannels.hostBridgeState);
    },
    handoffHostPreview(itemId, actionId) {
        return electron_1.ipcRenderer.invoke(shared_1.studioChannels.hostPreviewHandoff, itemId, actionId);
    },
    getRuntimeItemDetail(itemId) {
        return electron_1.ipcRenderer.invoke(shared_1.studioChannels.runtimeItemDetail, itemId);
    },
    runRuntimeItemAction(itemId, actionId) {
        return electron_1.ipcRenderer.invoke(shared_1.studioChannels.runtimeItemAction, itemId, actionId);
    }
};
electron_1.contextBridge.exposeInMainWorld("studio", studioApi);
