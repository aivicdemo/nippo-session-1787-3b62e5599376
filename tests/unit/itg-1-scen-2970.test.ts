import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-2970
  test('チーム波及度スコアが null のとき、優先度スコア計算がエラーになる', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム障害が発生しました',
      occurrenceFrequency: 5,
      impactScore: null,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(
      /チーム波及度スコア/
    );
  });
});