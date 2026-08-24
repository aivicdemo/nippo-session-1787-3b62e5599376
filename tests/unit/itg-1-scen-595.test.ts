import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  // SCEN-595: [edge] 課題優先度判定機能 - 影響度スコアが76（高位の閾値直上）の場合、優先度ランクが高に判定される
  test('影響度スコア76のとき優先度ランクが高と判定される', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'システム応答時間の遅延',
      occurrenceFrequency: 15,
      impactScore: 76,
      affectedTeamCount: 3,
      resolutionDaysAverage: 4,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-dev-01',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityRank).toBe('高');
    expect(result.priorityScore).toBeGreaterThanOrEqual(70);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.scoreBreakdown.impactScore).toBe(30);
    expect(result.colorCode).toBe('#FF0000');
    expect(result.calculatedAt).toBeDefined();
  });
});