import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度スコア範囲外エラーハンドリング', () => {
  test('SCEN-950: 影響度スコアが0～100の範囲外のときエラーを返す', () => {
    // 影響度スコア -10 のケース
    const inputBelowMin = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 5,
      impactScore: -10,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team-alpha',
    };

    expect(() => calculateIssuePriorityScore(inputBelowMin)).toThrow(/影響度スコア/);

    // 影響度スコア 101 のケース
    const inputAboveMax = {
      issueId: 'issue-002',
      issueContent: 'API rate limit exceeded',
      occurrenceFrequency: 8,
      impactScore: 101,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-beta',
    };

    expect(() => calculateIssuePriorityScore(inputAboveMax)).toThrow(/影響度スコア/);
  });
});