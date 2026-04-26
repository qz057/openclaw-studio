import { describe, it, expect } from 'vitest';
import { resolvePage, formatLiveSyncAge, dedupeCommandActions, dedupeById } from '../lib/app-utils';
import type { StudioCommandAction } from '@openclaw/shared';

describe('app-utils', () => {
  describe('resolvePage', () => {
    it('returns the page ID from hash if valid', () => {
      window.location.hash = '#dashboard';
      expect(resolvePage()).toBe('dashboard');

      window.location.hash = '#chat';
      expect(resolvePage()).toBe('chat');
    });

    it('returns "hermes" for invalid hash', () => {
      window.location.hash = '#invalid-page';
      expect(resolvePage()).toBe('hermes');

      window.location.hash = '';
      expect(resolvePage()).toBe('hermes');
    });

    it('returns "hermes" for removed home page', () => {
      window.location.hash = '#home';
      expect(resolvePage()).toBe('hermes'); // studioPageIds keeps legacy IDs, but the shell no longer routes to removed pages
    });

    it('returns "hermes" for removed Claude and Codex pages', () => {
      window.location.hash = '#claude';
      expect(resolvePage()).toBe('hermes');

      window.location.hash = '#codex';
      expect(resolvePage()).toBe('hermes');
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
