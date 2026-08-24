import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('issue extraction and prioritization', () => {
  // SCEN-3009: [edge] 課題優先度スコア自動計算機能 - 課題発生頻度が閾値超過（例：6回）のときスコアが上限側で計算される
  test('should calculate priority score at upper limit when occurrence frequency exceeds threshold', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 6,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(95);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityRank).toBe('高');
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(38);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toBe('#FF0000');
    expect(result.calculatedAt).toBeDefined();
    const calculatedDate = new Date(result.calculatedAt);
    expect(calculatedDate.getTime()).toBeLessThanOrEqual(new Date().getTime());
  });
});