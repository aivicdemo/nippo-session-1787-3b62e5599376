import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  test('SCEN-611: 同一の入力データで2回実行した場合、同じ優先度スコアが生成される', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: ['パフォーマンス問題'],
        confidence: 0.95,
      }),
      assessImpactScore: jest.fn().mockReturnValue(75),
      classifyIssueSeverity: jest.fn().mockReturnValue('high'),
    };

    const testInput = {
      issueId: 'issue-001',
      issueContent: 'パフォーマンス問題が発生している',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-dev-001',
    };

    const firstResult = calculateIssuePriorityScore(
      testInput,
      mockTextAnalysisServiceAdapter
    );

    const secondResult = calculateIssuePriorityScore(
      testInput,
      mockTextAnalysisServiceAdapter
    );

    expect(firstResult.priorityScore).toBe(secondResult.priorityScore);
    expect(firstResult.priorityScore).toEqual(secondResult.priorityScore);
    expect(firstResult.priorityRank).toBe(secondResult.priorityRank);
    expect(firstResult.scoreBreakdown.frequencyScore).toBe(
      secondResult.scoreBreakdown.frequencyScore
    );
    expect(firstResult.scoreBreakdown.impactScore).toBe(
      secondResult.scoreBreakdown.impactScore
    );
    expect(firstResult.scoreBreakdown.resolutionDifficultyScore).toBe(
      secondResult.scoreBreakdown.resolutionDifficultyScore
    );
  });
});