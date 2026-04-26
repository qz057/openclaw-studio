import { describe, it, expect } from 'vitest';
import {
  scoreSequence,
  scoreRouteState,
  scorePathHandoff,
  scoreRouteHistoryEntry,
  includesContextAction
} from '../reviewCoverageRouteState';
import type {
  StudioCommandCompanionReviewSequence,
  StudioCommandCompanionRouteState,
  StudioCommandCompanionPathHandoff,
  StudioCommandCompanionRouteHistoryEntry
} from '@openclaw/shared';

describe('reviewCoverageRouteState', () => {
  describe('scoreSequence', () => {
    const mockSequence: StudioCommandCompanionReviewSequence = {
      id: 'seq-1',
      label: 'Sequence 1',
      summary: 'Test sequence',
      tone: 'neutral' as const,
      steps: [
        { id: 'step-1', summary: 'Step 1', actionId: 'action-a', role: 'current-review-surface' as const },
        { id: 'step-2', summary: 'Step 2', actionId: 'action-b', role: 'primary-companion' as const }
      ]
    };

    it('scores 8 for matching companionSequenceId', () => {
      expect(scoreSequence(mockSequence, null, 'seq-1')).toBe(8);
    });

    it('scores 6 for matching step actionId', () => {
      expect(scoreSequence(mockSequence, 'action-a', null)).toBe(6);
      expect(scoreSequence(mockSequence, 'action-b', null)).toBe(6);
    });

    it('scores 14 for both matches', () => {
      expect(scoreSequence(mockSequence, 'action-a', 'seq-1')).toBe(14);
    });

    it('scores 0 for no matches', () => {
      expect(scoreSequence(mockSequence, 'action-x', 'seq-x')).toBe(0);
    });
  });

  describe('scoreRouteState', () => {
    const mockRouteState: StudioCommandCompanionRouteState = {
      id: 'route-1',
      label: 'Route 1',
      summary: 'Test route',
      tone: 'neutral' as const,
      sourceActionId: 'action-source',
      currentActionId: 'action-current',
      routeActionIds: ['action-a', 'action-b'],
      posture: 'active-route' as const,
      sequenceSwitches: [],
      activeSequenceId: 'seq-1',
      activeReviewPathId: undefined
    };

    it('scores 10 for matching companionRouteStateId', () => {
      expect(scoreRouteState(mockRouteState, null, 'route-1')).toBe(12); // 10 + 2 for active-route
    });

    it('scores 8 for matching currentActionId', () => {
      expect(scoreRouteState(mockRouteState, 'action-current', null)).toBe(10); // 8 + 2 for active-route
    });

    it('scores 5 for matching sourceActionId or routeActionIds', () => {
      expect(scoreRouteState(mockRouteState, 'action-source', null)).toBe(7); // 5 + 2
      expect(scoreRouteState(mockRouteState, 'action-a', null)).toBe(7); // 5 + 2
    });

    it('scores 2 for active-route posture', () => {
      const inactiveRoute = { ...mockRouteState, posture: 'alternate-route' as const };
      expect(scoreRouteState(inactiveRoute, null, null)).toBe(0);
      expect(scoreRouteState(mockRouteState, null, null)).toBe(2);
    });
  });

  describe('includesContextAction', () => {
    const contextActionIds = new Set(['action-1', 'action-2']);

    it('returns true if actionIds includes context action', () => {
      expect(includesContextAction(['action-1', 'action-3'], contextActionIds, null)).toBe(true);
      expect(includesContextAction(['action-2'], contextActionIds, null)).toBe(true);
    });

    it('returns true if actionIds includes activeReviewSurfaceActionId', () => {
      expect(includesContextAction(['action-x'], contextActionIds, 'action-x')).toBe(true);
    });

    it('returns false if no matches', () => {
      expect(includesContextAction(['action-x', 'action-y'], contextActionIds, null)).toBe(false);
    });
  });

  describe('scorePathHandoff', () => {
    const mockHandoff: StudioCommandCompanionPathHandoff = {
      id: 'handoff-1',
      label: 'Handoff 1',
      summary: 'Test handoff',
      tone: 'neutral' as const,
      sourceActionId: 'action-source',
      targetActionId: 'action-target',
      followUpActionId: 'action-followup',
      stability: 'stable' as const,
      reviewPathId: 'path-1',
      routeStateId: 'route-1',
      sequenceId: 'seq-1'
    };

    it('scores 10 for matching companionPathHandoffId', () => {
      expect(scorePathHandoff(mockHandoff, null, 'handoff-1')).toBe(12); // 10 + 2 for stable
    });

    it('scores 8 for matching targetActionId', () => {
      expect(scorePathHandoff(mockHandoff, 'action-target', null)).toBe(10); // 8 + 2
    });

    it('scores 5 for matching sourceActionId or followUpActionId', () => {
      expect(scorePathHandoff(mockHandoff, 'action-source', null)).toBe(7); // 5 + 2
      expect(scorePathHandoff(mockHandoff, 'action-followup', null)).toBe(7); // 5 + 2
    });

    it('scores 2 for stable stability', () => {
      const unstableHandoff = { ...mockHandoff, stability: 'watch' as const };
      expect(scorePathHandoff(unstableHandoff, null, null)).toBe(0);
      expect(scorePathHandoff(mockHandoff, null, null)).toBe(2);
    });
  });

  describe('scoreRouteHistoryEntry', () => {
    const mockEntry: StudioCommandCompanionRouteHistoryEntry = {
      id: 'entry-1',
      label: 'Entry 1',
      summary: 'Test entry',
      tone: 'neutral' as const,
      timestampLabel: '2024-01-01',
      sourceActionId: 'action-source',
      targetActionId: 'action-target',
      transitionKind: 'resume-history' as const,
      reviewPathId: undefined,
      routeStateId: undefined
    };

    it('scores 10 for matching companionRouteHistoryEntryId', () => {
      expect(scoreRouteHistoryEntry(mockEntry, null, 'entry-1')).toBe(12); // 10 + 2 for resume-history
    });

    it('scores 8 for matching targetActionId', () => {
      expect(scoreRouteHistoryEntry(mockEntry, 'action-target', null)).toBe(10); // 8 + 2
    });

    it('scores 4 for matching sourceActionId', () => {
      expect(scoreRouteHistoryEntry(mockEntry, 'action-source', null)).toBe(6); // 4 + 2
    });

    it('scores 2 for resume-history transitionKind', () => {
      const otherEntry = { ...mockEntry, transitionKind: 'activate-route' as const };
      expect(scoreRouteHistoryEntry(otherEntry, null, null)).toBe(0);
      expect(scoreRouteHistoryEntry(mockEntry, null, null)).toBe(2);
    });
  });
});
