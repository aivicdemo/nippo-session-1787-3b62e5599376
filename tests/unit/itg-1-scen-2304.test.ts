import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Impact Score Validation', () => {
  // SCEN-2304: [edge] 課題影響度判定機能 - チーム波及度スコアが 100 を超える無効値の場合、処理が適切に判定される
  test('should reject invalid impact score exceeding 100 and log error', () => {
    const input = {
      issueId: 'ISSUE-001',
      issueContent: 'システムダウン',
      occurrenceFrequency: 5,
      impactScore: 101,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-001',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/INVALID_IMPACT_SCORE/);
  });
});