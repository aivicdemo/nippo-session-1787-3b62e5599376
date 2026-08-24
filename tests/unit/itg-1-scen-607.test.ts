import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  // SCEN-607
  test('過去30日間の課題発生履歴がある課題は高いスコアが算出される', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'サーバー障害に関する報告',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.4,
      reportingDate: '2024-12-15',
      teamId: 'team-dev-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(75);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityRank).toBe('高');
    expect(result.scoreBreakdown.frequencyScore).toBe(32);
    expect(result.scoreBreakdown.impactScore).toBe(30);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(13);
    expect(result.colorCode).toBe('#FF0000');
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});