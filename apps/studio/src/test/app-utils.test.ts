import { describe, it, expect } from 'vitest';
import { mockShellState } from '@openclaw/shared/mock-shell-state';
import { resolvePage, resolveStartupPage, getRouteHashForPageId, visibleStudioPageIds, formatLiveSyncAge, dedupeCommandActions, dedupeById } from '../lib/app-utils';
import type { StudioCommandAction } from '@openclaw/shared';

describe('app-utils', () => {
  describe('resolvePage', () => {
    it('returns the page ID from hash if valid', () => {
      window.location.hash = '#dashboard';
      expect(resolvePage()).toBe('dashboard');

      window.location.hash = '#chat';
      expect(resolvePage()).toBe('chat');
    });

    it('returns "dashboard" for invalid hash', () => {
      window.location.hash = '#invalid-page';
      expect(resolvePage()).toBe('dashboard');

      window.location.hash = '';
      expect(resolvePage()).toBe('dashboard');
    });

    it('keeps overview as the startup page and first navigation entry', () => {
      window.location.hash = '#session';
      expect(resolveStartupPage()).toBe('dashboard');
      expect(visibleStudioPageIds[0]).toBe('dashboard');
    });

    it('returns "dashboard" for removed home page', () => {
      window.location.hash = '#home';
      expect(resolvePage()).toBe('dashboard'); // studioPageIds keeps legacy IDs, but the shell now defaults removed routes to 总览
    });

    it('maps removed Claude and Hermes routes into the unified session page', () => {
      window.location.hash = '#claude';
      expect(resolvePage()).toBe('chat');

      window.location.hash = '#hermes';
      expect(resolvePage()).toBe('chat');
    });

    it('returns "dashboard" for removed Codex page', () => {
      window.location.hash = '#codex';
      expect(resolvePage()).toBe('dashboard');
    });

    it('returns product route hashes for visible pages', () => {
      expect(getRouteHashForPageId('chat')).toBe('session');
      expect(getRouteHashForPageId('sessions')).toBe('history');
      expect(getRouteHashForPageId('skills')).toBe('capabilities');
      expect(getRouteHashForPageId('agents')).toBe('diagnostics');
    });

    it('keeps fallback pages aligned with the visible navigation', () => {
      expect(mockShellState.pages.map((page) => page.id)).toEqual([...visibleStudioPageIds]);
    });

    it('keeps removed routes out of command entry actions', () => {
      const actionIds = mockShellState.commandSurface.actions.map((action) => action.id);
      expect(actionIds).not.toContain('command-open-home');
      expect(actionIds).not.toContain('command-open-skills');

      const routeIds = mockShellState.commandSurface.actions.flatMap((action) => (action.routeId ? [action.routeId] : []));
      expect(routeIds).not.toContain('home');
      expect(routeIds).not.toContain('codex');
      expect(routeIds).not.toContain('claude');
      expect(routeIds).not.toContain('hermes');
    });

    it('keeps removed routes out of command matchers and shortcuts', () => {
      const removedRouteIds = new Set(['home', 'codex', 'claude', 'hermes']);
      const removedActionIds = new Set(['command-open-home', 'command-open-skills']);
      const commandSurface = mockShellState.commandSurface;
      const matcherRouteIds = [
        ...commandSurface.actionGroups.flatMap((group) => group.match?.routeIds ?? []),
        ...commandSurface.sequences.flatMap((sequence) => sequence.match?.routeIds ?? []),
        ...commandSurface.contextualFlows.flatMap((flow) => flow.match?.routeIds ?? []),
        ...commandSurface.nextStepBoards.flatMap((board) => board.match?.routeIds ?? []),
        ...commandSurface.actionDecks.flatMap((deck) => deck.match?.routeIds ?? [])
      ];
      const referencedActionIds = [
        ...commandSurface.quickActionIds,
        ...commandSurface.contexts.flatMap((context) => context.actionIds),
        ...commandSurface.actionGroups.flatMap((group) => group.actionIds),
        ...commandSurface.sequences.flatMap((sequence) => [
          ...sequence.actionIds,
          sequence.recommendedActionId,
          ...(sequence.followUpActionIds ?? [])
        ]),
        ...commandSurface.contextualFlows.flatMap((flow) => [
          flow.recommendedActionId,
          ...(flow.followUpActionIds ?? []),
          ...(flow.keyboardShortcutIds ?? [])
        ]),
        ...commandSurface.keyboardRouting.shortcuts.flatMap((shortcut) => [shortcut.id, shortcut.actionId])
      ].filter((value): value is string => Boolean(value));

      expect([...new Set(matcherRouteIds)].filter((routeId) => removedRouteIds.has(routeId))).toEqual([]);
      expect([...new Set(referencedActionIds)].filter((actionId) => removedActionIds.has(actionId))).toEqual([]);
    });
  });

  describe('formatLiveSyncAge', () => {
    it('returns "等待同步" for null timestamp', () => {
      expect(formatLiveSyncAge(null)).toBe('等待同步');
    });

    it('returns "刚刚同步" for recent timestamp (<15s)', () => {
      const now = Date.now();
      expect(formatLiveSyncAge(now)).toBe('刚刚同步');
      expect(formatLiveSyncAge(now - 10_000)).toBe('刚刚同步');
    });

    it('returns seconds for 15s-60s range', () => {
      const now = Date.now();
      expect(formatLiveSyncAge(now - 20_000)).toBe('20 秒前');
      expect(formatLiveSyncAge(now - 45_000)).toBe('45 秒前');
    });

    it('returns minutes for 1min-60min range', () => {
      const now = Date.now();
      expect(formatLiveSyncAge(now - 90_000)).toBe('1 分钟前');
      expect(formatLiveSyncAge(now - 300_000)).toBe('5 分钟前');
    });

    it('returns hours for >60min', () => {
      const now = Date.now();
      expect(formatLiveSyncAge(now - 3_600_000)).toBe('1 小时前');
      expect(formatLiveSyncAge(now - 7_200_000)).toBe('2 小时前');
    });
  });

  describe('dedupeCommandActions', () => {
    it('removes duplicate actions by id', () => {
      const actions: StudioCommandAction[] = [
        { id: 'a', label: 'Action A' } as StudioCommandAction,
        { id: 'b', label: 'Action B' } as StudioCommandAction,
        { id: 'a', label: 'Action A Duplicate' } as StudioCommandAction,
      ];

      const result = dedupeCommandActions(actions);
      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('a');
      expect(result[1]?.id).toBe('b');
    });

    it('filters out undefined actions', () => {
      const actions = [
        { id: 'a', label: 'Action A' } as StudioCommandAction,
        undefined,
        { id: 'b', label: 'Action B' } as StudioCommandAction,
      ];

      const result = dedupeCommandActions(actions);
      expect(result).toHaveLength(2);
    });

    it('returns empty array for empty input', () => {
      expect(dedupeCommandActions([])).toEqual([]);
    });
  });

  describe('dedupeById', () => {
    it('removes duplicate items by id', () => {
      const items = [
        { id: 'x', value: 1 },
        { id: 'y', value: 2 },
        { id: 'x', value: 3 },
      ];

      const result = dedupeById(items);
      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('x');
      expect(result[1]?.id).toBe('y');
    });

    it('preserves order of first occurrence', () => {
      const items = [
        { id: 'a', value: 1 },
        { id: 'b', value: 2 },
        { id: 'a', value: 3 },
        { id: 'c', value: 4 },
      ];

      const result = dedupeById(items);
      expect(result.map(i => i.id)).toEqual(['a', 'b', 'c']);
      expect(result[0]?.value).toBe(1); // first occurrence
    });
  });
});
