import { describe, test, expect } from '@jest/globals';
import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import type { BottleneckAnalysisInput, IssueTimeSeriesRecord } from '../../src/logic/monthly-performance-analysis';

describe('analyzeBottleneckTrendWithTimeSeries - Weekly Aggregation with Single Issue', () => {
  // SCEN-1942
  test('should aggregate single issue data by week with correct attributes when analyzing weekly period', () => {
    const analysisStartDate = new Date('2026-08-18T00:00:00Z');
    const analysisEndDate = new Date('2026-08-24T23:59:59Z');

    const issueTimeSeriesData: IssueTimeSeriesRecord[] = [
      {
        issueId: 'ISSUE-001',
        recordDate: new Date('2026-08-20T09:30:00Z'),
        occurrenceCount: 1,
        impactScore: 75,
        resolutionDaysElapsed: 0,
        resolutionStatus: 'open',
      },
    ];

    const input: BottleneckAnalysisInput = {
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      minimumDataPointsThreshold: 1,
      outlierDetectionEnabled: false,
    };

    const result = analyzeBottleneckTrendWithTimeSeries(input);

    expect(result).toBeDefined();
    expect(result.issueId).toBe('ISSUE-001');
    expect(result.bottleneckSeverityRank).toMatch(/critical|high|medium|low/);
    expect(result.bottleneckSeverityScore).toBeGreaterThanOrEqual(0);
    expect(result.bottleneckSeverityScore).toBeLessThanOrEqual(100);
    expect(result.improvementTrend).toMatch(/improving|stable|deteriorating/);
    expect(result.averageResolutionDays).toBeGreaterThanOrEqual(0);
    expect(result.peakOccurrenceDate).toEqual(new Date('2026-08-20T09:30:00Z'));
    expect(result.timeSeriesTrendData).toBeDefined();
    expect(Array.isArray(result.timeSeriesTrendData)).toBe(true);
    expect(result.timeSeriesTrendData.length).toBe(1);

    const weeklyTrendPoint = result.timeSeriesTrendData[0];
    expect(weeklyTrendPoint.date).toEqual(new Date('2026-08-20T09:30:00Z'));
    expect(weeklyTrendPoint.occurrenceCount).toBe(1);
    expect(weeklyTrendPoint.impactScore).toBe(75);
    expect(weeklyTrendPoint.resolutionRate).toBeGreaterThanOrEqual(0);
    expect(weeklyTrendPoint.resolutionRate).toBeLessThanOrEqual(100);
  });
});