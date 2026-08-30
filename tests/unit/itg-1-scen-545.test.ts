import { calculateProductivityMetrics, type ProductivityMetricsInput, type ProductivityMetricsOutput } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算', () => {
  // SCEN-545: resolutionThresholdが0以下のとき、clamp処理により解決判定の日数が1日に正規化される
  test('resolutionThresholdが0以下のとき解決判定の日数を1日に正規化して計算を続行する', () => {
    const input: ProductivityMetricsInput = {
      aggregationStartDate: new Date('2024-01-01T00:00:00Z'),
      aggregationEndDate: new Date('2024-01-31T23:59:59Z'),
      targetTeamIds: ['team-001'],
      excludeOutliers: false,
      resolutionThreshold: 0,
    };

    const result: ProductivityMetricsOutput = calculateProductivityMetrics(input);

    expect(result).toBeDefined();
    expect(typeof result.issueResolutionSpeed).toBe('number');
    expect(typeof result.reportSubmissionRate).toBe('number');
    expect(typeof result.issueRecurrenceRate).toBe('number');
    expect(typeof result.teamProductivityScore).toBe('number');
    expect(result.dataQualityAssessment).toBeDefined();
    expect(typeof result.dataQualityAssessment.completenessPercentage).toBe('number');
    expect(typeof result.dataQualityAssessment.extractionAccuracy).toBe('number');
    expect(typeof result.dataQualityAssessment.isReportable).toBe('boolean');

    expect(result.issueResolutionSpeed).toBeGreaterThanOrEqual(0);
    expect(result.reportSubmissionRate).toBeGreaterThanOrEqual(0);
    expect(result.reportSubmissionRate).toBeLessThanOrEqual(100);
    expect(result.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
    expect(result.issueRecurrenceRate).toBeLessThanOrEqual(100);
    expect(result.teamProductivityScore).toBeGreaterThanOrEqual(0);
    expect(result.teamProductivityScore).toBeLessThanOrEqual(100);
    expect(result.dataQualityAssessment.completenessPercentage).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityAssessment.completenessPercentage).toBeLessThanOrEqual(100);
    expect(result.dataQualityAssessment.extractionAccuracy).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityAssessment.extractionAccuracy).toBeLessThanOrEqual(100);
  });
});