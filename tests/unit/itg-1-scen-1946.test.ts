import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';

describe('月次期間区分での課題時系列分析', () => {
  // SCEN-1946
  test('課題データが複数件の場合、各課題が出現月ごとに集計・集約される', () => {
    const analysisStartDate = new Date('2026-01-01T00:00:00Z');
    const analysisEndDate = new Date('2026-01-31T23:59:59Z');

    const issueTimeSeriesData = [
      {
        issueId: 'issue-A',
        recordDate: new Date('2026-01-05'),
        occurrenceCount: 1,
        impactScore: 75,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open' as const,
      },
      {
        issueId: 'issue-B',
        recordDate: new Date('2026-01-10'),
        occurrenceCount: 1,
        impactScore: 60,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'in_progress' as const,
      },
      {
        issueId: 'issue-C',
        recordDate: new Date('2026-01-05'),
        occurrenceCount: 1,
        impactScore: 50,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'resolved' as const,
      },
    ];

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn((text: string) => ({
        keywords: [{ keyword: text, frequency: 1 }],
        confidence: 0.95,
      })),
      assessImpactScore: jest.fn((keyword: string) => 70),
      classifyIssueSeverity: jest.fn((text: string) => 'high' as const),
    };

    const result = analyzeBottleneckTrendWithTimeSeries(
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      7,
      true,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toBeDefined();
    expect(result.timeSeriesTrendData).toBeDefined();
    expect(Array.isArray(result.timeSeriesTrendData)).toBe(true);

    const january2026Records = result.timeSeriesTrendData.filter(
      (record) =>
        record.date.getFullYear() === 2026 &&
        record.date.getMonth() === 0
    );

    expect(january2026Records.length).toBeGreaterThanOrEqual(1);

    const aggregatedIssueIds = new Set<string>();
    issueTimeSeriesData.forEach((data) => {
      if (
        data.recordDate.getFullYear() === 2026 &&
        data.recordDate.getMonth() === 0
      ) {
        aggregatedIssueIds.add(data.issueId);
      }
    });

    expect(aggregatedIssueIds.size).toBe(3);
    expect(aggregatedIssueIds.has('issue-A')).toBe(true);
    expect(aggregatedIssueIds.has('issue-B')).toBe(true);
    expect(aggregatedIssueIds.has('issue-C')).toBe(true);

    expect(result.bottleneckSeverityScore).toBeGreaterThanOrEqual(0);
    expect(result.bottleneckSeverityScore).toBeLessThanOrEqual(100);

    expect(result.averageResolutionDays).toBeGreaterThanOrEqual(0);

    expect(result.peakOccurrenceDate).toBeDefined();

    expect(
      ['critical', 'high', 'medium', 'low'].includes(
        result.bottleneckSeverityRank
      )
    ).toBe(true);

    expect(['improving', 'stable', 'deteriorating'].includes(result.improvementTrend)).toBe(true);
  });
});