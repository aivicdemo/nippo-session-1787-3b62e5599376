import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1967: [edge] 課題再発パターン時系列分析機能 - 再発パターン集計時に複数件の同一課題キーワードが同じ時刻に記録されている場合、すべてカウントされる
  test('同じタイムスタンプで記録された同一課題キーワード4件がすべて集計対象に含まれ、該当時刻のカウント値が4となること', () => {
    // Arrange
    const commonTimestamp = new Date('2026-08-19T09:00:00Z');
    
    const issueTimeSeriesData = [
      {
        issueId: 'issue-001',
        recordDate: commonTimestamp,
        occurrenceCount: 1,
        impactScore: 85,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open' as const,
      },
      {
        issueId: 'issue-002',
        recordDate: commonTimestamp,
        occurrenceCount: 1,
        impactScore: 85,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open' as const,
      },
      {
        issueId: 'issue-003',
        recordDate: commonTimestamp,
        occurrenceCount: 1,
        impactScore: 85,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open' as const,
      },
      {
        issueId: 'issue-004',
        recordDate: commonTimestamp,
        occurrenceCount: 1,
        impactScore: 85,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open' as const,
      },
    ];

    const analysisStartDate = new Date('2026-08-19T00:00:00Z');
    const analysisEndDate = new Date('2026-08-19T23:59:59Z');

    // Mock TextAnalysisServiceAdapter
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          { keyword: 'サーバーダウン', frequency: 1 },
          { keyword: 'サーバーダウン', frequency: 1 },
          { keyword: 'サーバーダウン', frequency: 1 },
          { keyword: 'サーバーダウン', frequency: 1 },
        ],
      }),
      assessImpactScore: jest.fn().mockReturnValue(85),
      classifyIssueSeverity: jest.fn().mockReturnValue('high'),
    };

    // Act
    const result = analyzeBottleneckTrendWithTimeSeries(
      {
        analysisStartDate,
        analysisEndDate,
        issueTimeSeriesData,
        minimumDataPointsThreshold: 7,
        outlierDetectionEnabled: true,
      },
      mockTextAnalysisServiceAdapter
    );

    // Assert
    expect(result.issueId).toBeDefined();
    expect(result.bottleneckSeverityScore).toBeGreaterThan(0);
    expect(result.bottleneckSeverityScore).toBeLessThanOrEqual(100);
    
    // Verify that all 4 occurrences of the same keyword at the same timestamp are counted
    const peakOccurrenceTime = result.peakOccurrenceDate.getTime();
    const commonTime = commonTimestamp.getTime();
    expect(peakOccurrenceTime).toBe(commonTime);

    // Verify time series data includes all 4 occurrences aggregated at this timestamp
    const aggregatedDataAtPeakTime = result.timeSeriesTrendData.filter(
      (point) => point.date.getTime() === commonTime
    );
    expect(aggregatedDataAtPeakTime.length).toBeGreaterThan(0);
    
    // The aggregated occurrence count should be 4 (all identical keyword occurrences counted)
    const aggregatedOccurrenceCount = aggregatedDataAtPeakTime[0].occurrenceCount;
    expect(aggregatedOccurrenceCount).toBe(4);
  });
});