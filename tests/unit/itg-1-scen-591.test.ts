import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  // SCEN-591
  test('影響度スコアが49（中位の閾値直下）の場合、優先度ランクが低に判定される', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'データベース接続が不安定',
      occurrenceFrequency: 2,
      impactScore: 49,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityRank).toBe('低');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.colorCode).toBe('#00FF00');
    expect(result.scoreBreakdown).toHaveProperty('frequencyScore');
    expect(result.scoreBreakdown).toHaveProperty('impactScore');
    expect(result.scoreBreakdown).toHaveProperty('resolutionDifficultyScore');
    expect(result.calculatedAt).toBeDefined();
  });
});