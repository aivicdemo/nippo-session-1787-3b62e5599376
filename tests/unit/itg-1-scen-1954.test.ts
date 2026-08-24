import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1954
  test('期間区分に未対応の値が渡されたときエラーになる', () => {
    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const analysisEndDate = new Date('2024-01-31T23:59:59Z');

    const issueTimeSeriesData = [
      {
        issueId: 'issue-001',
        recordDate: new Date('2024-01-15'),
        occurrenceCount: 2,
        impactScore: 75,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'open' as const,
      },
    ];

    expect(() =>
      analyzeBottleneckTrendWithTimeSeries(
        {
          analysisStartDate,
          analysisEndDate,
          issueTimeSeriesData,
          minimumDataPointsThreshold: 7,
          outlierDetectionEnabled: true,
        },
        'quarter'
      )
    ).toThrow(/期間区分/);

    expect(() =>
      analyzeBottleneckTrendWithTimeSeries(
        {
          analysisStartDate,
          analysisEndDate,
          issueTimeSeriesData,
          minimumDataPointsThreshold: 7,
          outlierDetectionEnabled: true,
        },
        '半年'
      )
    ).toThrow(/期間区分/);

    expect(() =>
      analyzeBottleneckTrendWithTimeSeries(
        {
          analysisStartDate,
          analysisEndDate,
          issueTimeSeriesData,
          minimumDataPointsThreshold: 7,
          outlierDetectionEnabled: true,
        },
        null as any
      )
    ).toThrow(/期間区分/);

    expect(() =>
      analyzeBottleneckTrendWithTimeSeries(
        {
          analysisStartDate,
          analysisEndDate,
          issueTimeSeriesData,
          minimumDataPointsThreshold: 7,
          outlierDetectionEnabled: true,
        },
        undefined as any
      )
    ).toThrow(/期間区分/);

    expect(() =>
      analyzeBottleneckTrendWithTimeSeries(
        {
          analysisStartDate,
          analysisEndDate,
          issueTimeSeriesData,
          minimumDataPointsThreshold: 7,
          outlierDetectionEnabled: true,
        },
        0 as any
      )
    ).toThrow(/期間区分/);

    expect(() =>
      analyzeBottleneckTrendWithTimeSeries(
        {
          analysisStartDate,
          analysisEndDate,
          issueTimeSeriesData,
          minimumDataPointsThreshold: 7,
          outlierDetectionEnabled: true,
        },
        ''
      )
    ).toThrow(/期間区分/);
  });
});