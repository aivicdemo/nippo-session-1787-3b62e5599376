import { describe, test, expect } from '@jest/globals';
import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア表示', () => {
  // SCEN-2385: [edge] 課題解決速度の定量化 - 課題が1日で解決したとき、解決速度を1日として記録する
  test('should record resolution speed as 1 day when issue is resolved within same calendar day', () => {
    const analysisStartDate = new Date('2024-01-15T00:00:00Z');
    const analysisEndDate = new Date('2024-01-15T23:59:59Z');

    const issueTimeSeriesData = [
      {
        issueId: 'ISSUE-001',
        recordDate: new Date('2024-01-15'),
        occurrenceCount: 1,
        impactScore: 75,
        resolutionDaysElapsed: 0,
        resolutionStatus: 'open' as const,
      },
      {
        issueId: 'ISSUE-001',
        recordDate: new Date('2024-01-15'),
        occurrenceCount: 1,
        impactScore: 75,
        resolutionDaysElapsed: 0,
        resolutionStatus: 'resolved' as const,
      },
    ];

    const result = analyzeBottleneckTrendWithTimeSeries(
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      7,
      true,
    );

    expect(result).toBeDefined();
    expect(result.issueId).toBe('ISSUE-001');
    expect(result.averageResolutionDays).toBe(1);
    expect(result.bottleneckSeverityScore).toBeGreaterThanOrEqual(0);
    expect(result.bottleneckSeverityScore).toBeLessThanOrEqual(100);
    expect(['critical', 'high', 'medium', 'low']).toContain(
      result.bottleneckSeverityRank,
    );
    expect(result.timeSeriesTrendData).toBeDefined();
    expect(Array.isArray(result.timeSeriesTrendData)).toBe(true);
    expect(result.timeSeriesTrendData.length).toBeGreaterThan(0);

    const firstTrendPoint = result.timeSeriesTrendData[0];
    expect(firstTrendPoint.date).toBeDefined();
    expect(typeof firstTrendPoint.occurrenceCount).toBe('number');
    expect(typeof firstTrendPoint.impactScore).toBe('number');
    expect(typeof firstTrendPoint.resolutionRate).toBe('number');
    expect(firstTrendPoint.occurrenceCount).toBeGreaterThanOrEqual(0);
    expect(firstTrendPoint.impactScore).toBeGreaterThanOrEqual(0);
    expect(firstTrendPoint.impactScore).toBeLessThanOrEqual(100);
    expect(firstTrendPoint.resolutionRate).toBeGreaterThanOrEqual(0);
    expect(firstTrendPoint.resolutionRate).toBeLessThanOrEqual(100);
  });
});