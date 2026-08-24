import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';

describe('課題の時系列分析機能', () => {
  // SCEN-1955
  test('開始日と終了日が同じ日付で期間区分が月次のときエラーになる', () => {
    const analysisStartDate = new Date('2026-01-15T00:00:00Z');
    const analysisEndDate = new Date('2026-01-15T23:59:59Z');
    const issueTimeSeriesData = [
      {
        issueId: 'issue-001',
        recordDate: new Date('2026-01-15'),
        occurrenceCount: 1,
        impactScore: 50,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open' as const,
      },
    ];

    expect(() =>
      analyzeBottleneckTrendWithTimeSeries(
        analysisStartDate,
        analysisEndDate,
        issueTimeSeriesData,
        7,
        true
      )
    ).toThrow(/同じ日付/);
  });
});