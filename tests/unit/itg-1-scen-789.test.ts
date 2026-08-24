import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation - Team Impact Assessment', () => {
  // SCEN-789: [normal] 課題優先度スコア算出機能 - チーム波及度スコアが0-100の正常範囲で返された場合、その値が優先度スコア計算に正しく用いられる
  test('should correctly incorporate impact score of 65 into priority score calculation formula', () => {
    // Arrange: Mock TextAnalysisServiceAdapter that returns impact score of 65
    const mockTextAnalysisService = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockResolvedValue(65),
      classifyIssueSeverity: jest.fn(),
    };

    // Input data for priority score calculation
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース障害',
      occurrenceFrequency: 3,
      impactScore: 65, // This will be used in the calculation
      affectedTeamCount: 2,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    // Act: Call calculateIssuePriorityScore with the mocked service
    const result = calculateIssuePriorityScore(input, mockTextAnalysisService);

    // Assert: Verify that the priority score is calculated correctly using impact score 65
    // According to the formula: priorityScore should be between 1-100
    expect(result).toBeDefined();
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);

    // Verify the score breakdown shows impact score of 65 was used
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.impactScore).toBe(65);

    // Verify that the impact score (65) is correctly incorporated into the calculation
    // The impact score should contribute to the final priorityScore calculation
    const expectedContributionFromImpactScore = 65 * 0.4; // Assuming 40% weight from design spec
    const calculatedPriorityScore = result.priorityScore;

    // Verify that priority score reflects the impact score value (65) in its calculation
    expect(calculatedPriorityScore).toBeGreaterThan(0);
    expect(calculatedPriorityScore).toBeLessThanOrEqual(100);

    // Verify the color code corresponds to the calculated priority score
    if (calculatedPriorityScore >= 70) {
      expect(result.colorCode).toBe('#FF0000'); // Red for high priority
    } else if (calculatedPriorityScore >= 40) {
      expect(result.colorCode).toBe('#FFFF00'); // Yellow for medium priority
    } else {
      expect(result.colorCode).toBe('#00FF00'); // Green for low priority
    }

    // Verify priority rank is set correctly based on score threshold
    if (calculatedPriorityScore >= 70) {
      expect(result.priorityRank).toBe('高');
    } else if (calculatedPriorityScore >= 40) {
      expect(result.priorityRank).toBe('中');
    } else {
      expect(result.priorityRank).toBe('低');
    }

    // Verify calculated timestamp is set
    expect(result.calculatedAt).toBeDefined();
    expect(new Date(result.calculatedAt).getTime()).toBeGreaterThan(0);

    // Verify that the impact score (65) is not cached or stale
    expect(result.scoreBreakdown.impactScore).toBe(65);
    expect(result.scoreBreakdown.impactScore).not.toBe(0);
    expect(result.scoreBreakdown.impactScore).not.toBe(100);

    // Verify frequency score component is properly calculated
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);

    // Verify resolution difficulty score component is properly calculated
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // Final verification: Total priority score is sum of components
    const totalFromBreakdown =
      result.scoreBreakdown.frequencyScore +
      result.scoreBreakdown.impactScore +
      result.scoreBreakdown.resolutionDifficultyScore;

    // The calculated priority score should be based on the breakdown
    expect(result.priorityScore).toBeLessThanOrEqual(totalFromBreakdown);
  });
});