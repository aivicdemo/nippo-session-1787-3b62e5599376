import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - calculateIssuePriorityScore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1034
  test('should calculate priority score with normal TextAnalysisServiceAdapter response', () => {
    // Arrange
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          { text: '顧客対応', frequency: 3 },
          { text: 'バグ修正', frequency: 2 },
          { text: 'ドキュメント作成', frequency: 1 }
        ]
      }),
      assessImpactScore: jest.fn().mockReturnValue(75),
      classifyIssueSeverity: jest.fn().mockReturnValue('high')
    };

    const reportText =
      '昨日は顧客対応を3件実施し、バグ修正2件を対応した。今日はドキュメント作成を予定している。抱えている課題は顧客対応時の対応時間短縮である。';

    const input = {
      issueId: 'issue-001',
      issueContent: '顧客対応時の対応時間短縮',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001'
    };

    // Act
    const result = calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);

    // Assert
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(reportText);

    expect(result).toEqual(
      expect.objectContaining({
        issueId: 'issue-001',
        priorityScore: expect.any(Number),
        priorityRank: expect.stringMatching(/^(高|中|低)$/),
        scoreBreakdown: expect.objectContaining({
          frequencyScore: expect.any(Number),
          impactScore: expect.any(Number),
          resolutionDifficultyScore: expect.any(Number)
        }),
        colorCode: expect.stringMatching(/^#[0-9A-F]{6}$/),
        calculatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      })
    );

    // Verify score calculation formula
    // frequencyScore (0-40): based on occurrenceFrequency
    // impactScore (0-40): from impact assessment
    // resolutionDifficultyScore (0-20): based on resolution days average
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // Verify priorityScore is sum of breakdown scores (1-100)
    const expectedPriorityScore =
      result.scoreBreakdown.frequencyScore +
      result.scoreBreakdown.impactScore +
      result.scoreBreakdown.resolutionDifficultyScore;
    expect(result.priorityScore).toBe(expectedPriorityScore);
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);

    // Verify priority rank assignment based on score thresholds
    // high: >= 70, medium: >= 40, low: < 40
    if (result.priorityScore >= 70) {
      expect(result.priorityRank).toBe('高');
      expect(result.colorCode).toBe('#FF0000');
    } else if (result.priorityScore >= 40) {
      expect(result.priorityRank).toBe('中');
      expect(result.colorCode).toBe('#FFFF00');
    } else {
      expect(result.priorityRank).toBe('低');
      expect(result.colorCode).toBe('#00FF00');
    }
  });
});