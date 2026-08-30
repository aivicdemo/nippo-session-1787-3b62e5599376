import { aggregateReportsByPeriod, type AggregationPeriodRequest } from '../../src/logic/report-data-aggregation';

describe('Report Data Aggregation', () => {
  // SCEN-374: [normal] 指定された期間（日次・週次・月次）の複数メンバーの日報を集約し、課題データを構造化して集計対象データセットを確定する
  test('should aggregate reports by period and return structured dataset with quality metrics', () => {
    const startDate = new Date('2025-01-10T00:00:00Z');
    const endDate = new Date('2025-01-17T23:59:59Z');

    const request: AggregationPeriodRequest = {
      startDate,
      endDate,
      periodType: 'daily',
      includeArchivedReports: false,
    };

    const result = aggregateReportsByPeriod(request);

    expect(result).toBeDefined();
    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toEqual(new Date('2025-01-10T00:00:00Z'));
    expect(result.aggregationPeriod.endDate).toEqual(new Date('2025-01-17T23:59:59Z'));
    expect(result.aggregationPeriod.periodType).toBe('daily');

    expect(typeof result.totalReportCount).toBe('number');
    expect(result.totalReportCount).toBeGreaterThanOrEqual(70);

    expect(Array.isArray(result.aggregatedIssues)).toBe(true);
    if (result.aggregatedIssues.length > 0) {
      const firstIssue = result.aggregatedIssues[0];
      expect(typeof firstIssue.issueId).toBe('string');
      expect(typeof firstIssue.issueContent).toBe('string');
      expect(typeof firstIssue.occurrenceCount).toBe('number');
      expect(Array.isArray(firstIssue.affectedTeams)).toBe(true);
    }

    expect(result.dataQualityMetrics).toBeDefined();
    expect(typeof result.dataQualityMetrics.completenessScore).toBe('number');
    expect(result.dataQualityMetrics.completenessScore).toBe(95);
    expect(typeof result.dataQualityMetrics.accuracyScore).toBe('number');
    expect(result.dataQualityMetrics.accuracyScore).toBe(92);
    expect(typeof result.dataQualityMetrics.deduplicationRate).toBe('number');
    expect(result.dataQualityMetrics.deduplicationRate).toBe(88);

    expect(result.generatedAt).toBeInstanceOf(Date);
    const generatedAtTime = result.generatedAt.getTime();
    const nowTime = new Date().getTime();
    expect(Math.abs(nowTime - generatedAtTime)).toBeLessThan(5000);
  });
});