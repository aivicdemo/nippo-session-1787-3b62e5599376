import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  // SCEN-2968
  test('課題発生頻度が空文字列のとき、優先度スコア計算がValidationErrorを発生させる', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'システムエラー',
      occurrenceFrequency: '' as any,
      impactScore: 45,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/課題発生頻度/);
  });
});