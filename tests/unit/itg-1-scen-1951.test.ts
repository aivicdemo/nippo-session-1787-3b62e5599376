import { describe, test, expect } from '@jest/globals';
import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';

describe('課題の時系列分析機能 - 期間区分が未指定の場合', () => {
  test('SCEN-1951: 期間区分（日次・週次・月次）が指定されていないときエラーになる', () => {
    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const analysisEndDate = new Date('2024-01-31T23:59:59Z');

    const issueTimeSeriesData = [
      {
        issueId: 'ISSUE-001',
        recordDate: new Date('2024-01-05T00:00:00Z'),
        occurrenceCount: 2,
        impactScore: 75,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'in_progress' as const,
      },
      {
        issueId: 'ISSUE-001',
        recordDate: new Date('2024-01-06T00:00:00Z'),
        occurrenceCount: 1,
        impactScore: 70,
        resolutionDaysElapsed: 4,
        resolutionStatus: 'resolved' as const,
      },
    ];

    const inputWithoutPeriodGranularity = {
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      minimumDataPointsThreshold: 7,
      outlierDetectionEnabled: true,
    };

    expect(() =>
      analyzeBottleneckTrendWithTimeSeries(inputWithoutPeriodGranularity as any)
    ).toThrow(/期間区分/);
  });
});