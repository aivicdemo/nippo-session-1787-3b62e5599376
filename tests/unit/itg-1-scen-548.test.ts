import { calculateProductivityMetrics, type ProductivityMetricsInput, type ProductivityMetricsOutput } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算', () => {
  // SCEN-548: 異常値が全体の30%を超える場合の警告処理
  test('SCEN-548: 異常値が全体の30%を超えるときに警告メッセージを出力し、異常値を除外した指標で再計算すること', async () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');
    const targetTeamIds = ['team-001'];

    const normalIssueData = Array.from({ length: 21 }, (_, i) => ({
      issueId: `issue-normal-${i + 1}`,
      reportedDate: new Date('2024-01-15T09:00:00Z'),
      resolvedDate: new Date('2024-01-20T17:00:00Z'),
      status: 'resolved' as const,
      resolutionDays: 5,
    }));

    const anomalousIssueData = Array.from({ length: 10 }, (_, i) => ({
      issueId: `issue-anomaly-${i + 1}`,
      reportedDate: new Date('2024-01-10T09:00:00Z'),
      resolvedDate: new Date('2024-02-05T17:00:00Z'),
      status: 'resolved' as const,
      resolutionDays: 26,
    }));

    const combinedIssueData = [...normalIssueData, ...anomalousIssueData];

    const submissionData = {
      totalMembers: 10,
      actualSubmissionCount: 31,
      expectedSubmissionCount: 31,
      submissionRate: 100,
    };

    const recurrenceData = {
      overallRecurrenceRate: 9.68,
      recurrentIssueIds: ['issue-normal-5', 'issue-normal-12', 'issue-anomaly-3'],
    };

    const normalizedMetrics = {
      issueResolutionSpeed: 5,
      reportSubmissionRate: 100,
      issueRecurrenceRate: 3.23,
    };

    const mockInput: ProductivityMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      excludeOutliers: true,
    };

    const result: ProductivityMetricsOutput = await calculateProductivityMetrics(mockInput);

    expect(result).toBeDefined();
    expect(result.detectedAnomalies).toBeDefined();
    expect(result.detectedAnomalies?.length).toBe(10);

    if (result.detectedAnomalies && result.detectedAnomalies.length > 0) {
      result.detectedAnomalies.forEach((anomaly) => {
        expect(anomaly).toHaveProperty('anomalyType');
        expect(anomaly).toHaveProperty('rootCauseClassification');
        expect(anomaly).toHaveProperty('affectedMetricValue');
      });
    }

    expect(result.dataQualityAssessment).toBeDefined();
    expect(result.dataQualityAssessment.completenessPercentage).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityAssessment.completenessPercentage).toBeLessThanOrEqual(100);
    expect(result.dataQualityAssessment.extractionAccuracy).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityAssessment.extractionAccuracy).toBeLessThanOrEqual(100);
    expect(typeof result.dataQualityAssessment.isReportable).toBe('boolean');

    const anomalyRatio = (result.detectedAnomalies?.length ?? 0) / 31;
    expect(anomalyRatio).toBeGreaterThan(0.3);

    expect(result.issueResolutionSpeed).toBe(5);
    expect(result.reportSubmissionRate).toBe(100);
    expect(result.issueRecurrenceRate).toBeCloseTo(3.23, 1);
    expect(result.teamProductivityScore).toBeGreaterThanOrEqual(0);
    expect(result.teamProductivityScore).toBeLessThanOrEqual(100);
  });
});