import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-925: [edge] 課題優先度スコア算出機能 - 影響度スコア中位閾値（50）直上（50.01）のとき、中優先度に分類される
  test('影響度スコア50.01のとき、優先度が「中」に分類される', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout on production',
      occurrenceFrequency: 5,
      impactScore: 50.01,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityRank).toBe('中');
    expect(result.priorityScore).toBeGreaterThanOrEqual(40);
    expect(result.priorityScore).toBeLessThan(70);
    expect(result.scoreBreakdown.impactScore).toBe(20.004);
    expect(result.colorCode).toBe('#FFFF00');
    expect(result.calculatedAt).toBeDefined();
  });
});