import { calculateIssuePriorityScore, type IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Negative Frequency Error Handling', () => {
  // SCEN-630: [error] 課題優先度スコア計算機能 - 課題の発生頻度が負数のとき例外を発生させる
  test('should throw error when issue frequency is negative', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが頻発している',
      occurrenceFrequency: -5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-dev-01'
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/発生頻度/);
  });
});