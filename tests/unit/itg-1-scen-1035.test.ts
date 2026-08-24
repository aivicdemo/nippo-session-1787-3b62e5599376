import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring with TextAnalysisServiceAdapter Integration', () => {
  // SCEN-1035: TextAnalysisServiceAdapter連携 - assessImpactScore メソッドが正常応答した場合、チーム波及度スコア（0-100）が業務ロジックに返される
  test('should correctly receive and utilize impact score from TextAnalysisServiceAdapter.assessImpactScore', async () => {
    // Stub TextAnalysisServiceAdapter with assessImpactScore returning team wave propagation score
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockResolvedValue(85),
      classifyIssueSeverity: jest.fn(),
    };

    // Test input based on IssuePriorityScoringInput type
    const issueData = {
      issueId: 'ISS-20240115-001',
      issueContent: 'サーバー障害により全システムが停止状態。顧客への対応が急務。',
      occurrenceFrequency: 3,
      impactScore: 85, // This will be validated against assessImpactScore result
      affectedTeamCount: 4,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-DEV-001',
    };

    // Call business logic with stubbed adapter
    const result = await calculateIssuePriorityScore(
      issueData,
      textAnalysisServiceAdapterStub
    );

    // Verify that assessImpactScore was called with appropriate parameters
    expect(textAnalysisServiceAdapterStub.assessImpactScore).toHaveBeenCalled();

    // Verify that the impact score (85) was properly received and integrated into priority calculation
    // Expected score calculation:
    // - frequencyScore (occurrence: 3) = Math.min(3 * 10, 40) = 30
    // - impactScore (provided: 85, normalized to 0-40 range) = 85 * (40/100) = 34
    // - resolutionDifficultyScore (avg days: 2.5) = Math.min(2.5 * 8, 20) = 20
    // - Total priorityScore = 30 + 34 + 20 = 84
    expect(result.issueId).toBe('ISS-20240115-001');
    expect(result.priorityScore).toBe(84);
    expect(result.priorityRank).toBe('高');
    expect(result.colorCode).toBe('#FF0000');

    // Verify score breakdown shows impact score component correctly utilized
    expect(result.scoreBreakdown).toEqual({
      frequencyScore: 30,
      impactScore: 34,
      resolutionDifficultyScore: 20,
    });

    // Verify that the adapter's impact score (85) was accessible to the business logic
    // by checking that it influenced the final calculation
    expect(result.scoreBreakdown.impactScore).toBe(34); // 85 * (40/100)
  });
});