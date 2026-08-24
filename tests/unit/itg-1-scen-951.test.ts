import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-951
  test('色分けルール設定が null のときエラーをスローする', () => {
    const input = {
      issueId: 'ISSUE-001',
      issueContent: 'データベース接続エラー',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-A',
    };

    expect(() => {
      calculateIssuePriorityScore(input, null);
    }).toThrow(/色分けルール設定/);
  });
});