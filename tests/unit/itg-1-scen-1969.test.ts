import { describe, test, expect } from '@jest/globals';
import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import type { IssueTimeSeriesRecord, BottleneckTrendAnalysisResult, DailyTrendPoint } from '../../src/logic/monthly-performance-analysis';

describe('analyzeBottleneckTrendWithTimeSeries - 課題再発パターン時系列分析機能', () => {
  // SCEN-1969: 分析対象期間内の課題データが逆序で入力されたとき、正しい時系列順で集計される
  test('should sort time series data in ascending order regardless of input order', () => {
    const analysisStartDate = new Date('2026-01-01T00:00:00Z');
    const analysisEndDate = new Date('2026-01-31T23:59:59Z');

    const reverseOrderedData: IssueTimeSeriesRecord[] = [
      {
        issueId: 'issue-001',
        recordDate: new Date('2026-01-31'),
        occurrenceCount: 2,
        impactScore: 75,
        resolutionDaysElapsed: 5,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'issue-001',
        recordDate: new Date('2026-01-25'),
        occurrenceCount: 1,
        impactScore: 60,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'in_progress',
      },
      {
        issueId: 'issue-001',
        recordDate: new Date('2026-01-10'),
        occurrenceCount: 3,
        impactScore: 85,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-001',
        recordDate: new Date('2026-01-05'),
        occurrenceCount: 1,
        impactScore: 50,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-001',
        recordDate: new Date('2026-01-01'),
        occurrenceCount: 2,
        impactScore: 70,
        resolutionDaysElapsed: 0,
        resolutionStatus: 'open',
      },
    ];

    const result: BottleneckTrendAnalysisResult = analyzeBottleneckTrendWithTimeSeries(
      'issue-001',
      analysisStartDate,
      analysisEndDate,
      reverseOrderedData,
      7,
      true
    );

    expect(result.issueId).toBe('issue-001');
    expect(result.timeSeriesTrendData).toBeDefined();
    expect(result.timeSeriesTrendData.length).toBe(5);

    const trendDates: Date[] = result.timeSeriesTrendData.map((point: DailyTrendPoint) => point.date);
    
    for (let i = 1; i < trendDates.length; i++) {
      expect(trendDates[i].getTime()).toBeGreaterThanOrEqual(trendDates[i - 1].getTime());
    }

    expect(trendDates[0].getTime()).toBe(new Date('2026-01-01').getTime());
    expect(trendDates[1].getTime()).toBe(new Date('2026-01-05').getTime());
    expect(trendDates[2].getTime()).toBe(new Date('2026-01-10').getTime());
    expect(trendDates[3].getTime()).toBe(new Date('2026-01-25').getTime());
    expect(trendDates[4].getTime()).toBe(new Date('2026-01-31').getTime());

    expect(result.timeSeriesTrendData[0].occurrenceCount).toBe(2);
    expect(result.timeSeriesTrendData[1].occurrenceCount).toBe(1);
    expect(result.timeSeriesTrendData[2].occurrenceCount).toBe(3);
    expect(result.timeSeriesTrendData[3].occurrenceCount).toBe(1);
    expect(result.timeSeriesTrendData[4].occurrenceCount).toBe(2);

    expect(result.timeSeriesTrendData[0].impactScore).toBe(70);
    expect(result.timeSeriesTrendData[1].impactScore).toBe(50);
    expect(result.timeSeriesTrendData[2].impactScore).toBe(85);
    expect(result.timeSeriesTrendData[3].impactScore).toBe(60);
    expect(result.timeSeriesTrendData[4].impactScore).toBe(75);

    expect(result.bottleneckSeverityScore).toBeGreaterThan(0);
    expect(result.bottleneckSeverityScore).toBeLessThanOrEqual(100);
    expect(['critical', 'high', 'medium', 'low']).toContain(result.bottleneckSeverityRank);
    expect(['improving', 'stable', 'deteriorating']).toContain(result.improvementTrend);
  });
});