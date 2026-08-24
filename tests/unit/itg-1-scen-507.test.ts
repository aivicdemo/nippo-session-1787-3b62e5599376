import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  test('SCEN-507: [edge] 課題キーワード出現頻度が0%で最低優先度に分類される', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: '特に課題はありません',
      occurrenceFrequency: 0,
      impactScore: 0,
      affectedTeamCount: 0,
      resolutionDaysAverage: 0,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.priorityScore).toBe(0);
    expect(result.priorityRank).toBe('低');
    expect(result.colorCode).toBe('#00FF00');
    expect(result.scoreBreakdown.frequencyScore).toBe(0);
    expect(result.scoreBreakdown.impactScore).toBe(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(0);
    expect(result.issueId).toBe('issue-001');
    expect(typeof result.calculatedAt).toBe('string');
  });
});