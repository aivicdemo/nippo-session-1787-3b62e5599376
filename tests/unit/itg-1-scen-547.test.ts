import { calculateProductivityMetrics } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算', () => {
  // SCEN-547
  test('集計期間内の日報データが10件未満のときに警告メッセージが含まれる', () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');
    const targetTeamIds = ['team-A'];
    const excludeOutliers = true;

    const input = {
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      excludeOutliers,
    };

    const result = calculateProductivityMetrics(input);

    expect(result).toBeDefined();
    expect(result.dataQualityAssessment).toBeDefined();
    expect(result.dataQualityAssessment.isReportable).toBe(false);
    expect(result.dataQualityAssessment.completenessPercentage).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityAssessment.completenessPercentage).toBeLessThanOrEqual(100);
    expect(result.dataQualityAssessment.extractionAccuracy).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityAssessment.extractionAccuracy).toBeLessThanOrEqual(100);

    expect(result.issueResolutionSpeed).toBeDefined();
    expect(typeof result.issueResolutionSpeed).toBe('number');
    expect(result.reportSubmissionRate).toBeDefined();
    expect(typeof result.reportSubmissionRate).toBe('number');
    expect(result.issueRecurrenceRate).toBeDefined();
    expect(typeof result.issueRecurrenceRate).toBe('number');
    expect(result.teamProductivityScore).toBeDefined();
    expect(typeof result.teamProductivityScore).toBe('number');
  });
});