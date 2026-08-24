import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度判定機能', () => {
  test('SCEN-592: 影響度スコア51（中位の閾値直上）の場合、優先度ランクが中に判定される', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが間欠的に発生',
      occurrenceFrequency: 5,
      impactScore: 51,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-02-15',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.priorityRank).toBe('中');
    expect(result.priorityScore).toBeGreaterThanOrEqual(40);
    expect(result.priorityScore).toBeLessThan(70);
    expect(result.scoreBreakdown.impactScore).toBeCloseTo(20, 0);
    expect(result.colorCode).toBe('#FFFF00');
    expect(result.issueId).toBe('issue-001');
  });
});