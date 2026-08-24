import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア付与機能', () => {
  // SCEN-559
  test('[normal] 課題優先度判定機能 - 1件の課題のみが報告されている場合、その課題に対して影響度スコアと優先度ランクが判定される', () => {
    // Setup: Mock TextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      assessImpactScore: jest.fn().mockReturnValue(65),
      classifyIssueSeverity: jest.fn().mockReturnValue('高'),
      extractKeywords: jest.fn(),
    };

    // Prepare test data: single issue report
    const issueInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'DB接続エラーが頻発している',
      occurrenceFrequency: 5,
      impactScore: 65,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    // Execute: Call the priority scoring function
    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      issueInput,
      mockTextAnalysisService
    );

    // Assert: Verify the result matches expected values
    expect(result).toEqual({
      issueId: 'issue-001',
      priorityScore: expect.any(Number),
      priorityRank: '高',
      scoreBreakdown: {
        frequencyScore: expect.any(Number),
        impactScore: 65,
        resolutionDifficultyScore: expect.any(Number),
      },
      colorCode: '#FF0000',
      calculatedAt: expect.any(String),
    });

    // Verify the priority score is within valid range (1-100)
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);

    // Verify impact score is correctly assigned
    expect(result.scoreBreakdown.impactScore).toBe(65);

    // Verify priority rank is correctly set
    expect(result.priorityRank).toBe('高');

    // Verify color code for high priority
    expect(result.colorCode).toBe('#FF0000');

    // Verify the service was called with correct parameters
    expect(mockTextAnalysisService.assessImpactScore).toHaveBeenCalledWith(
      'DB接続エラーが頻発している'
    );
    expect(mockTextAnalysisService.classifyIssueSeverity).toHaveBeenCalledWith(
      'DB接続エラーが頻発している'
    );

    // Verify calculated timestamp is in ISO 8601 format
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});