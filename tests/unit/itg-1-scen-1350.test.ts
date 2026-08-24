import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコアリング', () => {
  // SCEN-1350: [edge] 課題影響度判定機能 - 影響度スコア100点（最大値）の課題が正確に高優先度に判定される
  test('影響度スコア100点の課題が高優先度に判定される', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: '本番環境でのシステム障害',
      occurrenceFrequency: 5,
      impactScore: 100,
      affectedTeamCount: 8,
      resolutionDaysAverage: 2,
      reportingDate: '2024-12-15T09:00:00Z',
      teamId: 'team-alpha',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result).toEqual({
      issueId: 'issue-001',
      priorityScore: 100,
      priorityRank: '高',
      scoreBreakdown: {
        frequencyScore: 20,
        impactScore: 40,
        resolutionDifficultyScore: 20,
      },
      colorCode: '#FF0000',
      calculatedAt: expect.any(String),
    });

    expect(result.priorityScore).toBe(100);
    expect(result.priorityRank).toBe('高');
    expect(result.colorCode).toBe('#FF0000');
    expect(result.scoreBreakdown.impactScore).toBe(40);
  });
});