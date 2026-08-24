import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能 - 影響度スコア閾値判定', () => {
  test('SCEN-924: 影響度スコア中位閾値直下（49.99）のとき低優先度に分類される', () => {
    const issueInput = {
      issueId: 'ISSUE-001',
      issueContent: 'データベース接続タイムアウト',
      occurrenceFrequency: 3,
      impactScore: 49.99,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.5,
      reportingDate: '2026-01-15',
      teamId: 'TEAM-001',
    };

    const result = calculateIssuePriorityScore(issueInput);

    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBeLessThan(40);
    expect(result.priorityRank).toBe('低');
    expect(result.colorCode).toBe('#00FF00');
    expect(result.scoreBreakdown.impactScore).toBeLessThan(20);
    expect(typeof result.calculatedAt).toBe('string');
  });
});