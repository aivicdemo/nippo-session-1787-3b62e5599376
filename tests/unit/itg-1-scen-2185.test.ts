import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation - Same Day Reference Period', () => {
  let mockTextAnalysisServiceAdapter: any;

  beforeEach(() => {
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2185: [edge] 課題優先度スコア算出機能 - 過去データ参照期間の開始日と終了日が同日の場合、該当日の課題のみで優先度スコアが算出される
  test('should calculate priority score using only issues from the reference date when start and end dates are identical', async () => {
    const referenceDate = new Date('2026-08-19T00:00:00Z');
    const beforeDate = new Date('2026-08-18T00:00:00Z');
    const afterDate = new Date('2026-08-20T00:00:00Z');

    // Mock adapter responses for issues on reference date
    mockTextAnalysisServiceAdapter.extractKeywords.mockResolvedValue([
      { keyword: 'issue_a', frequency: 3 },
      { keyword: 'issue_b', frequency: 2 },
      { keyword: 'issue_c', frequency: 1 },
    ]);

    mockTextAnalysisServiceAdapter.assessImpactScore
      .mockResolvedValueOnce(75) // issue_a
      .mockResolvedValueOnce(50) // issue_b
      .mockResolvedValueOnce(25); // issue_c

    mockTextAnalysisServiceAdapter.classifyIssueSeverity
      .mockResolvedValueOnce('high') // issue_a
      .mockResolvedValueOnce('medium') // issue_b
      .mockResolvedValueOnce('low'); // issue_c

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'Critical system failure',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.5,
      reportingDate: '2026-08-19',
      teamId: 'team-001',
    };

    const result = await calculateIssuePriorityScore(
      input,
      mockTextAnalysisServiceAdapter,
      referenceDate,
      referenceDate
    );

    // Expected calculation:
    // frequencyScore = (3 / (3+2+1)) * 40 = (3 / 6) * 40 = 20
    // impactScore = 75 (direct from assessImpactScore)
    // resolutionDifficultyScore = (1.5 / 5) * 20 = 6 (capped at 20)
    // totalPriorityScore = 20 + 55 + 6 = ... (formula-based calculation)
    // Expected: approximately 52.5 when using weighted average approach
    // Actual formula application: (75 * 3 + 50 * 2 + 25 * 1) / (3 + 2 + 1) = 350 / 6 = 58.33

    expect(result).toBeDefined();
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(50);
    expect(result.priorityScore).toBeLessThanOrEqual(60);
    expect(result.priorityRank).toBe('high');
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toBe('#FF0000');
    expect(result.calculatedAt).toBeDefined();

    // Verify that extractKeywords was called only for the reference date
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: referenceDate,
        endDate: referenceDate,
      })
    );

    // Verify that adapter methods were called exactly 3 times (for 3 issues on reference date)
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(3);
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalledTimes(3);

    // Verify that issues outside the reference period were not considered
    const callArgs = mockTextAnalysisServiceAdapter.extractKeywords.mock.calls[0][0];
    expect(callArgs.startDate.getTime()).toBe(referenceDate.getTime());
    expect(callArgs.endDate.getTime()).toBe(referenceDate.getTime());
  });
});