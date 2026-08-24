import { describe, test, expect } from '@jest/globals';
import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import type { BottleneckAnalysisInput, IssueTimeSeriesRecord } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Bottleneck Trend Analysis', () => {
  // SCEN-1952
  test('should throw validation error when analysisStartDate is after analysisEndDate', () => {
    const invalidStartDate = new Date('2026-01-15T00:00:00Z');
    const invalidEndDate = new Date('2026-01-10T23:59:59Z');

    const mockTimeSeriesRecord: IssueTimeSeriesRecord = {
      issueId: 'ISSUE-001',
      recordDate: new Date('2026-01-12T00:00:00Z'),
      occurrenceCount: 3,
      impactScore: 75,
      resolutionDaysElapsed: 2,
      resolutionStatus: 'in_progress',
    };

    const input: BottleneckAnalysisInput = {
      analysisStartDate: invalidStartDate,
      analysisEndDate: invalidEndDate,
      issueTimeSeriesData: [mockTimeSeriesRecord],
      minimumDataPointsThreshold: 7,
      outlierDetectionEnabled: true,
    };

    expect(() => analyzeBottleneckTrendWithTimeSeries(input)).toThrow(/開始日/);
  });
});