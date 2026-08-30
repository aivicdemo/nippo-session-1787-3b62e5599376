import { describe, test, expect, jest } from '@jest/globals';
import { calculateProductivityMetrics } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算', () => {
  test('SCEN-556: 指定された集約期間内の日報データから課題解決速度、提出率、課題再発率を定量化し、生産性指標を計算する', () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');
    const targetTeamIds = ['team-001'];
    const excludeOutliers = false;

    const result = calculateProductivityMetrics({
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      excludeOutliers,
    });

    expect(result).toBeDefined();
    expect(result.issueResolutionSpeed).toBeCloseTo(3.5, 1);
    expect(result.reportSubmissionRate).toBeCloseTo(92.5, 1);
    expect(result.issueRecurrenceRate).toBeCloseTo(8.3, 1);
    expect(result.teamProductivityScore).toBe(78);
    expect(Array.isArray(result.detectedAnomalies)).toBe(true);
    expect(result.detectedAnomalies?.length).toBe(0);
    expect(result.dataQualityAssessment).toBeDefined();
    expect(result.dataQualityAssessment.completenessPercentage).toBeCloseTo(95, 1);
    expect(result.dataQualityAssessment.extractionAccuracy).toBeCloseTo(88, 1);
    expect(result.dataQualityAssessment.isReportable).toBe(true);
  });
});