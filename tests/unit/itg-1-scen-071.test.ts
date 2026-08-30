import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { aggregateReportsByPeriod, type AggregationPeriodRequest, type AggregatedReportDataset } from '../../src/logic/report-data-aggregation';

describe('report-data-aggregation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-071
  test('should aggregate reports by period and return structured dataset with quality metrics', async () => {
    const input: AggregationPeriodRequest = {
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z'),
      periodType: 'monthly',
      targetTeamIds: undefined,
      includeArchivedReports: undefined,
    };

    const result: AggregatedReportDataset = await aggregateReportsByPeriod(input);

    expect(result.aggregationPeriod.startDate).toEqual(new Date('2024-01-01T00:00:00Z'));
    expect(result.aggregationPeriod.endDate).toEqual(new Date('2024-01-31T23:59:59Z'));
    expect(result.aggregationPeriod.periodType).toBe('monthly');

    expect(typeof result.totalReportCount).toBe('number');
    expect(result.totalReportCount).toBeGreaterThanOrEqual(1);

    expect(Array.isArray(result.aggregatedIssues)).toBe(true);
    expect(result.aggregatedIssues.length).toBe(3);

    for (const issue of result.aggregatedIssues) {
      expect(typeof issue.issueId).toBe('string');
      expect(issue.issueId.length).toBeGreaterThan(0);
      expect(typeof issue.issueContent).toBe('string');
      expect(issue.issueContent.length).toBeGreaterThan(0);
      expect(typeof issue.occurrenceCount).toBe('number');
      expect(issue.occurrenceCount).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(issue.affectedTeams)).toBe(true);
    }

    expect(result.dataQualityMetrics.completenessScore).toBe(95);
    expect(result.dataQualityMetrics.accuracyScore).toBe(92);
    expect(result.dataQualityMetrics.deduplicationRate).toBe(98);

    expect(result.dataQualityMetrics.completenessScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityMetrics.completenessScore).toBeLessThanOrEqual(100);
    expect(result.dataQualityMetrics.accuracyScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityMetrics.accuracyScore).toBeLessThanOrEqual(100);
    expect(result.dataQualityMetrics.deduplicationRate).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityMetrics.deduplicationRate).toBeLessThanOrEqual(100);

    expect(result.generatedAt).toBeInstanceOf(Date);
    const timeDifference = Math.abs(result.generatedAt.getTime() - new Date().getTime());
    expect(timeDifference).toBeLessThan(5000);
  });
});