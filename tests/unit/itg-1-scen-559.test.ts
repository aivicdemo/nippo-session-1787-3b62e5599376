import { describe, test, expect } from '@jest/globals';
import { calculateProductivityMetrics } from '../../src/logic/productivity-metrics-calculation';
import type { ProductivityMetricsInput, ProductivityMetricsOutput } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算', () => {
  // SCEN-559: グラフ表示形式が指定されていないときのデフォルト表示形式検証
  test('should calculate productivity metrics with default visualization formats when displayPreference is not specified', () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');
    const targetTeamIds = ['team-001', 'team-002'];
    const excludeOutliers = false;

    const input: ProductivityMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      excludeOutliers,
    };

    const result: ProductivityMetricsOutput = calculateProductivityMetrics(input);

    expect(typeof result.issueResolutionSpeed).toBe('number');
    expect(typeof result.reportSubmissionRate).toBe('number');
    expect(typeof result.issueRecurrenceRate).toBe('number');
    expect(typeof result.teamProductivityScore).toBe('number');

    expect(result.issueResolutionSpeed).toBeGreaterThanOrEqual(0);
    expect(result.reportSubmissionRate).toBeGreaterThanOrEqual(0);
    expect(result.reportSubmissionRate).toBeLessThanOrEqual(100);
    expect(result.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
    expect(result.issueRecurrenceRate).toBeLessThanOrEqual(100);
    expect(result.teamProductivityScore).toBeGreaterThanOrEqual(0);
    expect(result.teamProductivityScore).toBeLessThanOrEqual(100);

    expect(result.dataQualityAssessment).toBeDefined();
    expect(typeof result.dataQualityAssessment.completenessPercentage).toBe('number');
    expect(typeof result.dataQualityAssessment.extractionAccuracy).toBe('number');
    expect(typeof result.dataQualityAssessment.isReportable).toBe('boolean');

    expect(result.dataQualityAssessment.completenessPercentage).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityAssessment.completenessPercentage).toBeLessThanOrEqual(100);
    expect(result.dataQualityAssessment.extractionAccuracy).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityAssessment.extractionAccuracy).toBeLessThanOrEqual(100);
  });
});