import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';

describe('課題再発パターン時系列分析 - 月次期間区分', () => {
  test('SCEN-1945: 2026年1月の課題データ1件を月別に集計する', () => {
    const analysisStartDate = new Date('2026-01-01T00:00:00Z');
    const analysisEndDate = new Date('2026-01-31T23:59:59Z');

    const issueTimeSeriesData = [
      {
        issueId: 'ISSUE-001',
        recordDate: new Date('2026-01-15'),
        occurrenceCount: 1,
        impactScore: 45,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'in_progress' as const,
      },
    ];

    const result = analyzeBottleneckTrendWithTimeSeries(
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      7,
      true
    );

    expect(result.issueId).toBe('ISSUE-001');
    expect(result.bottleneckSeverityScore).toBe(45);
    expect(result.averageResolutionDays).toBe(2);
    expect(result.peakOccurrenceDate).toEqual(new Date('2026-01-15'));
    expect(result.timeSeriesTrendData).toHaveLength(1);
    expect(result.timeSeriesTrendData[0].occurrenceCount).toBe(1);
    expect(result.timeSeriesTrendData[0].impactScore).toBe(45);
    expect(result.timeSeriesTrendData[0].resolutionRate).toBe(0);
  });
});