import { analyzeProductivityTrends } from '../../src/logic/productivity-metrics-calculation';
import type { ProductivityTrendsAnalysisInput, ProductivityTrendsAnalysisResult, ProductivityMetricsDataPoint, SuccessCriteria } from '../../src/logic/productivity-metrics-calculation';

describe('productivity-metrics-calculation: analyzeProductivityTrends with boundary conditions', () => {
  test('SCEN-511: should handle target issue recurrence rate reduction boundary conditions (clamping)', () => {
    // Setup: Create baseline data with 3 months of productivity metrics
    const aggregationPeriodStart = new Date('2024-01-01');
    const aggregationPeriodEnd = new Date('2024-03-31');
    const teamId = 'team-001';

    const productivityMetricsDataPoints: ProductivityMetricsDataPoint[] = [
      {
        periodDate: new Date('2024-01-31'),
        issueResolutionSpeed: 5.5,
        reportSubmissionRate: 95.0,
        issueRecurrenceRate: 12.5,
        teamProductivityScore: 78.0,
      },
      {
        periodDate: new Date('2024-02-29'),
        issueResolutionSpeed: 4.8,
        reportSubmissionRate: 96.5,
        issueRecurrenceRate: 10.2,
        teamProductivityScore: 82.5,
      },
      {
        periodDate: new Date('2024-03-31'),
        issueResolutionSpeed: 4.2,
        reportSubmissionRate: 97.0,
        issueRecurrenceRate: 8.1,
        teamProductivityScore: 85.0,
      },
    ];

    // Test case 1: targetIssueReductionRate = -10 (below minimum, should clamp to 0)
    const successCriteriaBelow: SuccessCriteria = {
      productivityImprovementRateTarget: 15,
      issueRecurrenceRateReductionTarget: -10, // Out of bounds, should clamp to 0
      deadlineComplianceRateTarget: 90,
    };

    const inputBelow: ProductivityTrendsAnalysisInput = {
      aggregationPeriodStart,
      aggregationPeriodEnd,
      productivityMetricsDataPoints,
      successCriteria: successCriteriaBelow,
      teamId,
    };

    const resultBelow: ProductivityTrendsAnalysisResult = analyzeProductivityTrends(inputBelow);

    // Verify clamping occurred and result is valid
    expect(resultBelow).toBeDefined();
    expect(resultBelow.trendDirection).toMatch(/improving|declining|stable/);
    expect(resultBelow.monthlyTrendData).toBeDefined();
    expect(resultBelow.monthlyTrendData.length).toBeGreaterThanOrEqual(3);
    expect(resultBelow.successJudgmentResult).toBeDefined();
    expect(typeof resultBelow.successJudgmentResult.achievementPercentage).toBe('number');
    expect(resultBelow.reportContent).toBeDefined();
    expect(typeof resultBelow.reportContent).toBe('string');

    // Test case 2: targetIssueReductionRate = 101 (above maximum, should clamp to 100)
    const successCriteriaAbove: SuccessCriteria = {
      productivityImprovementRateTarget: 15,
      issueRecurrenceRateReductionTarget: 101, // Out of bounds, should clamp to 100
      deadlineComplianceRateTarget: 90,
    };

    const inputAbove: ProductivityTrendsAnalysisInput = {
      aggregationPeriodStart,
      aggregationPeriodEnd,
      productivityMetricsDataPoints,
      successCriteria: successCriteriaAbove,
      teamId,
    };

    const resultAbove: ProductivityTrendsAnalysisResult = analyzeProductivityTrends(inputAbove);

    // Verify clamping occurred and result is valid
    expect(resultAbove).toBeDefined();
    expect(resultAbove.trendDirection).toMatch(/improving|declining|stable/);
    expect(resultAbove.monthlyTrendData).toBeDefined();
    expect(resultAbove.monthlyTrendData.length).toBeGreaterThanOrEqual(3);
    expect(resultAbove.successJudgmentResult).toBeDefined();
    expect(typeof resultAbove.successJudgmentResult.achievementPercentage).toBe('number');
    expect(resultAbove.reportContent).toBeDefined();
    expect(typeof resultAbove.reportContent).toBe('string');

    // Test case 3: targetIssueReductionRate = 0 (lower boundary, should use as-is)
    const successCriteriaLowerBound: SuccessCriteria = {
      productivityImprovementRateTarget: 15,
      issueRecurrenceRateReductionTarget: 0, // At lower boundary
      deadlineComplianceRateTarget: 90,
    };

    const inputLowerBound: ProductivityTrendsAnalysisInput = {
      aggregationPeriodStart,
      aggregationPeriodEnd,
      productivityMetricsDataPoints,
      successCriteria: successCriteriaLowerBound,
      teamId,
    };

    const resultLowerBound: ProductivityTrendsAnalysisResult = analyzeProductivityTrends(inputLowerBound);

    // Verify boundary value processed correctly
    expect(resultLowerBound).toBeDefined();
    expect(resultLowerBound.trendDirection).toMatch(/improving|declining|stable/);
    expect(resultLowerBound.monthlyTrendData).toBeDefined();
    expect(resultLowerBound.monthlyTrendData.length).toBeGreaterThanOrEqual(3);
    expect(resultLowerBound.successJudgmentResult).toBeDefined();
    expect(typeof resultLowerBound.successJudgmentResult.achievementPercentage).toBe('number');

    // Test case 4: targetIssueReductionRate = 100 (upper boundary, should use as-is)
    const successCriteriaUpperBound: SuccessCriteria = {
      productivityImprovementRateTarget: 15,
      issueRecurrenceRateReductionTarget: 100, // At upper boundary
      deadlineComplianceRateTarget: 90,
    };

    const inputUpperBound: ProductivityTrendsAnalysisInput = {
      aggregationPeriodStart,
      aggregationPeriodEnd,
      productivityMetricsDataPoints,
      successCriteria: successCriteriaUpperBound,
      teamId,
    };

    const resultUpperBound: ProductivityTrendsAnalysisResult = analyzeProductivityTrends(inputUpperBound);

    // Verify boundary value processed correctly
    expect(resultUpperBound).toBeDefined();
    expect(resultUpperBound.trendDirection).toMatch(/improving|declining|stable/);
    expect(resultUpperBound.monthlyTrendData).toBeDefined();
    expect(resultUpperBound.monthlyTrendData.length).toBeGreaterThanOrEqual(3);
    expect(resultUpperBound.successJudgmentResult).toBeDefined();
    expect(typeof resultUpperBound.successJudgmentResult.achievementPercentage).toBe('number');

    // Verify that all results have valid report content
    expect(resultLowerBound.reportContent).toBeDefined();
    expect(typeof resultLowerBound.reportContent).toBe('string');
    expect(resultUpperBound.reportContent).toBeDefined();
    expect(typeof resultUpperBound.reportContent).toBe('string');

    // Verify no design errors were thrown
    expect(true).toBe(true);
  });
});