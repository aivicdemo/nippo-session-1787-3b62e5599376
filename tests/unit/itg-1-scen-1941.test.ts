import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import { type IssueTimeSeriesRecord, type BottleneckTrendAnalysisResult } from '../../src/logic/monthly-performance-analysis';

describe('analyzeBottleneckTrendWithTimeSeries - Issue Recurrence Time Series Analysis', () => {
  // SCEN-1941
  test('should return empty aggregation result when daily period has zero issue data points', () => {
    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const analysisEndDate = new Date('2024-01-31T23:59:59Z');
    const issueTimeSeriesData: IssueTimeSeriesRecord[] = [];

    const result: BottleneckTrendAnalysisResult = analyzeBottleneckTrendWithTimeSeries({
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      minimumDataPointsThreshold: 7,
      outlierDetectionEnabled: true,
    });

    expect(result.timeSeriesTrendData).toEqual([]);
    expect(result.timeSeriesTrendData.length).toBe(0);
    expect(result.bottleneckSeverityScore).toBe(0);
    expect(result.averageResolutionDays).toBe(0);
    expect(result.bottleneckSeverityRank).toBe('low');
    expect(result.improvementTrend).toBe('stable');
  });
});