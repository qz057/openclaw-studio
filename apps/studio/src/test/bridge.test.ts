import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStudioApi } from '@openclaw/bridge';

describe('Bridge Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).studioRead;
    delete (window as any).studioSession;
    delete (window as any).studioGateway;
    delete (window as any).studioRuntime;
  });

  describe('getStudioApi', () => {
    it('prefers namespaced bridges when available', async () => {
      const getShellState = vi.fn();
      const listSessions = vi.fn();
      (window as any).studioRead = {
        getShellState,
        listSessions
      };
      (window as any).studioSession = {};
      (window as any).studioGateway = {};
      (window as any).studioRuntime = {};
      const api = await getStudioApi();
      expect(api.getShellState).toBe(getShellState);
      expect(api.listSessions).toBe(listSessions);
    });

    it('returns fallback API when namespaced bridges are unavailable', async () => {
      const api = await getStudioApi();

      expect(api).toBeDefined();
      expect(api.getShellState).toBeDefined();
      expect(api.listSessions).toBeDefined();
      expect(api.getOpenClawChatState).toBeDefined();
    });

    it('fallback API methods are callable', async () => {
      const api = await getStudioApi();

      const state = await api.getShellState();
      expect(state).toBeDefined();
      expect(state.status).toBeDefined();
    });
  });

  describe('Bridge API surface', () => {
    it('exposes all required methods', async () => {
      const api = await getStudioApi();

      const requiredMethods = [
        'getShellState',
        'listSessions',
        'listCodexTasks',
        'getOpenClawChatState',
        'sendOpenClawChatTurn',
        'getHermesState',
        'getHermesSnapshot',
        'getHermesSessionMessages',
        'connectHermes',
        'disconnectHermes',
        'sendHermesMessage',
        'getHostExecutorState',
        'getHostBridgeState',
        'handoffHostPreview',
        'getDeviceBootstrapState',
        'subscribePerformanceAlerts',
        'getPerformanceMetrics'
      ];

      for (const method of requiredMethods) {
        expect(api).toHaveProperty(method);
        expect(typeof (api as any)[method]).toBe('function');
      }
    });
  });
});
