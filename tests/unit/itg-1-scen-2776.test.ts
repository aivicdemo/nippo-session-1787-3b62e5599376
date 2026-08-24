import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-2776
  test('優先度スコアが中優先度閾値（50）の課題が中優先度色で表示される', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'システムのパフォーマンス低下問題',
      occurrenceFrequency: 5,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(50);
    expect(result.priorityRank).toBe('中');
    expect(result.colorCode).toBe('#FFFF00');
    expect(result.scoreBreakdown).toEqual({
      frequencyScore: expect.any(Number),
      impactScore: expect.any(Number),
      resolutionDifficultyScore: expect.any(Number),
    });
    expect(result.calculatedAt).toBeTruthy();
  });
});