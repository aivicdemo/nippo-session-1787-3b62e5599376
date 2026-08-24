import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  test('SCEN-574: チーム波及度スコアが-1のとき無効な入力エラーが発生する', () => {
    const invalidInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース障害',
      occurrenceFrequency: 5,
      impactScore: -1,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001'
    };

    expect(() => calculateIssuePriorityScore(invalidInput)).toThrow(/チーム波及度スコア/);
  });
});