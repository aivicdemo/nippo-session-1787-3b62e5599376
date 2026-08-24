import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-2143
  test('同一課題キーワードが0件の場合、優先度スコア算出対象が空配列で返される', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'ネットワーク接続の問題',
      occurrenceFrequency: 0,
      impactScore: 0,
      affectedTeamCount: 0,
      resolutionDaysAverage: 0,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001'
    };

    const result = calculateIssuePriorityScore(input);

    expect(result).toEqual([]);
  });
});