import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Idempotent Execution', () => {
  // SCEN-739
  test('should produce identical priority scores and extracted issues on repeated execution with same input', () => {
    // Arrange: TextAnalysisServiceAdapter stub
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        return [
          { keyword: 'データベース接続エラー', frequency: 2 },
          { keyword: 'ネットワーク遅延', frequency: 1 },
        ];
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: { [key: string]: number } = {
          'データベース接続エラー': 85,
          'ネットワーク遅延': 62,
        };
        return scoreMap[keyword] || 50;
      }),
      classifyIssueSeverity: jest.fn((text: string) => 'high'),
    };

    const testInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが発生した。ネットワークの遅延が課題。明日も対応予定',
      occurrenceFrequency: 2,
      impactScore: 78,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.5,
      reportingDate: '2024-01-15',
      teamId: 'team-alpha',
    };

    // Act: First execution
    const firstResult: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      testInput,
      mockTextAnalysisAdapter
    );

    // Capture first execution results
    const firstPriorityScore = firstResult.priorityScore;
    const firstScoreBreakdown = firstResult.scoreBreakdown;
    const firstPriorityRank = firstResult.priorityRank;

    // Act: Second execution with same input (stub state not reset)
    const secondResult: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      testInput,
      mockTextAnalysisAdapter
    );

    // Capture second execution results
    const secondPriorityScore = secondResult.priorityScore;
    const secondScoreBreakdown = secondResult.scoreBreakdown;
    const secondPriorityRank = secondResult.priorityRank;

    // Assert: Results must be identical
    expect(firstPriorityScore).toBe(secondPriorityScore);
    expect(firstPriorityScore).toBe(78);
    expect(secondPriorityScore).toBe(78);

    expect(firstScoreBreakdown.frequencyScore).toBe(secondScoreBreakdown.frequencyScore);
    expect(firstScoreBreakdown.impactScore).toBe(secondScoreBreakdown.impactScore);
    expect(firstScoreBreakdown.resolutionDifficultyScore).toBe(
      secondScoreBreakdown.resolutionDifficultyScore
    );

    expect(firstPriorityRank).toBe(secondPriorityRank);
    expect(secondPriorityRank).toBe('高');

    // Verify that mock was called consistently
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(2);
  });
});