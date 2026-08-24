import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation with TextAnalysisServiceAdapter', () => {
  it('SCEN-1036: classifyIssueSeverity normal response maps severity to priority score', () => {
    // Setup: Mock TextAnalysisServiceAdapter stub
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Configure stub to return normal response with high severity classification
    mockTextAnalysisAdapter.classifyIssueSeverity.mockResolvedValue({
      severity: 'high',
      confidence: 0.92,
      reasoning: 'サービス停止に直結',
    });

    // Test data for issue with critical impact
    const issueInput = {
      issueId: 'issue-001',
      issueContent: 'システム障害により朝9時のリマインド通知が配信されなかった',
      occurrenceFrequency: 3,
      impactScore: 85,
      affectedTeamCount: 2,
      resolutionDaysAverage: 4.5,
      reportingDate: '2024-11-15T09:30:00Z',
      teamId: 'team-dev-001',
    };

    // Execute: Call business logic with mocked adapter
    const result = calculateIssuePriorityScore(
      issueInput,
      mockTextAnalysisAdapter,
    );

    // Verify: Adapter method was called with correct parameters
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalledWith(
      issueInput.issueContent,
    );

    // Verify: Returned priority score reflects high severity classification
    // According to formula: frequencyScore(0-40) + impactScore(0-40) + resolutionDifficultyScore(0-20)
    // High severity → base multiplier 1.2x for critical issues
    // Calculation: (3 * 13.33) + (85 * 0.47) + (4.5 * 4.44) * 1.2
    // ≈ 40 + 40 + 20 = 100, capped at 100
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(100);
    expect(result.priorityRank).toBe('高');
    expect(result.scoreBreakdown.frequencyScore).toBe(40);
    expect(result.scoreBreakdown.impactScore).toBe(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(20);
    expect(result.colorCode).toBe('#FF0000');

    // Verify: Classification result is properly reflected in output
    expect(result.calculatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
    );
  });
});