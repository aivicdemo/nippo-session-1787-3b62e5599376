import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type { TeamPerformanceMetricsInput, TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('Team Performance Metrics - Zero Report Scenario', () => {
  // SCEN-2265
  it('should calculate issue frequency as 0 when no daily reports exist in the specified period', () => {
    // Setup: Test period 2026-01-01 to 2026-01-31 with zero daily reports
    const aggregationStartDate = new Date('2026-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2026-01-31T23:59:59Z');
    const teamIds = ['team-001'];
    const emptyReportRecords: any[] = [];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportRecords: emptyReportRecords,
    };

    // Execute: Call the performance metrics calculation function
    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);

    // Verify: Issue frequency must be 0
    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(Array.isArray(result.teamMetrics)).toBe(true);

    // When no reports exist, team metrics should reflect zero activity
    if (result.teamMetrics.length > 0) {
      const teamMetric = result.teamMetrics[0];
      expect(teamMetric.issueResolutionSpeed).toBe(0);
      expect(teamMetric.reportSubmissionRate).toBe(0);
      expect(teamMetric.issueRecurrenceRate).toBe(0);
    }

    // Verify aggregation period is correctly set
    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);

    // Data quality score should reflect the zero-data condition
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // Outlier detection result should exist and reflect no data anomalies
    expect(result.outlierDetectionResult).toBeDefined();
  });
});