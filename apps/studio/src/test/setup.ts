import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.studioApi for tests
(window as any).studioApi = {
  getShellState: vi.fn(),
  listSessions: vi.fn(),
  listCodexTasks: vi.fn(),
  getOpenClawChatState: vi.fn(),
  sendOpenClawChatTurn: vi.fn(),
  getHermesState: vi.fn(),
  getHermesSnapshot: vi.fn(),
  getHermesSessionMessages: vi.fn(),
  connectHermes: vi.fn(),
  disconnectHermes: vi.fn(),
  subscribeHermesEvents: vi.fn(),
  sendHermesMessage: vi.fn(),
  getHostExecutorState: vi.fn(),
  getHostBridgeState: vi.fn(),
  handoffHostPreview: vi.fn(),
  invokeHostBridgeSlot: vi.fn(),
  getRuntimeItemDetail: vi.fn(),
  runRuntimeItemAction: vi.fn(),
  getDeviceBootstrapState: vi.fn(),
  getPerformanceMetrics: vi.fn()
};

// Mock electron IPC
(window as any).electron = {
  ipcRenderer: {
    send: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn()
  }
};
