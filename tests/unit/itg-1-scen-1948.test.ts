import { describe, test, expect, beforeEach } from '@jest/globals';
import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';

describe('課題再発パターン時系列分析 - 確定性検証', () => {
  test('SCEN-1948: 同じ入力で分析を2回実行した場合、同じ集計結果が返される', () => {
    // 分析対象期間の開始日時（月初00:00）
    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    // 分析対象期間の終了日時（月末23:59）
    const analysisEndDate = new Date('2024-01-31T23:59:59Z');

    // 時系列データ：同一課題「ネットワーク接続エラーが頻発」の日別発生記録
    const issueTimeSeriesData = [
      {
        issueId: 'issue-connection-001',
        recordDate: new Date('2024-01-05'),
        occurrenceCount: 2,
        impactScore: 60,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'in_progress' as const,
      },
      {
        issueId: 'issue-connection-001',
        recordDate: new Date('2024-01-12'),
        occurrenceCount: 3,
        impactScore: 70,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'in_progress' as const,
      },
      {
        issueId: 'issue-connection-001',
        recordDate: new Date('2024-01-19'),
        occurrenceCount: 1,
        impactScore: 65,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'resolved' as const,
      },
    ];

    // モック化されたTextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          { keyword: '接続エラー', frequency: 3, confidenceScore: 0.92 },
        ],
      }),
      assessImpactScore: jest.fn().mockReturnValue({
        impactScore: 65,
      }),
      classifyIssueSeverity: jest.fn().mockReturnValue({
        severity: 'medium' as const,
      }),
    };

    // 1回目の分析実行
    const firstAnalysisResult = analyzeBottleneckTrendWithTimeSeries(
      {
        analysisStartDate,
        analysisEndDate,
        issueTimeSeriesData,
        minimumDataPointsThreshold: 3,
        outlierDetectionEnabled: true,
      },
      mockTextAnalysisService
    );

    // 1回目の結果を保存
    const firstIssueId = firstAnalysisResult.issueId;
    const firstSeverityRank = firstAnalysisResult.bottleneckSeverityRank;
    const firstSeverityScore = firstAnalysisResult.bottleneckSeverityScore;
    const firstImprovementTrend = firstAnalysisResult.improvementTrend;
    const firstAverageResolutionDays = firstAnalysisResult.averageResolutionDays;
    const firstPeakOccurrenceDate = firstAnalysisResult.peakOccurrenceDate;
    const firstTimeSeriesTrendDataLength =
      firstAnalysisResult.timeSeriesTrendData.length;

    // 2回目の分析実行（同じ入力データ）
    const secondAnalysisResult = analyzeBottleneckTrendWithTimeSeries(
      {
        analysisStartDate,
        analysisEndDate,
        issueTimeSeriesData,
        minimumDataPointsThreshold: 3,
        outlierDetectionEnabled: true,
      },
      mockTextAnalysisService
    );

    // 検証：issueIdの一致
    expect(secondAnalysisResult.issueId).toBe(firstIssueId);
    expect(secondAnalysisResult.issueId).toBe('issue-connection-001');

    // 検証：bottleneckSeverityRankの一致
    expect(secondAnalysisResult.bottleneckSeverityRank).toBe(firstSeverityRank);
    expect(firstSeverityRank).toBe('high');

    // 検証：bottleneckSeverityScoreの一致
    expect(secondAnalysisResult.bottleneckSeverityScore).toBe(firstSeverityScore);
    expect(firstSeverityScore).toBeGreaterThanOrEqual(0);
    expect(firstSeverityScore).toBeLessThanOrEqual(100);

    // 検証：improvementTrendの一致
    expect(secondAnalysisResult.improvementTrend).toBe(firstImprovementTrend);
    expect(['improving', 'stable', 'deteriorating']).toContain(
      firstImprovementTrend
    );

    // 検証：averageResolutionDaysの一致
    expect(secondAnalysisResult.averageResolutionDays).toBe(
      firstAverageResolutionDays
    );
    expect(firstAverageResolutionDays).toBe(2);

    // 検証：peakOccurrenceDateの一致
    expect(secondAnalysisResult.peakOccurrenceDate.getTime()).toBe(
      firstPeakOccurrenceDate.getTime()
    );
    expect(firstPeakOccurrenceDate).toEqual(new Date('2024-01-12'));

    // 検証：timeSeriesTrendDataの要素数一致
    expect(secondAnalysisResult.timeSeriesTrendData.length).toBe(
      firstTimeSeriesTrendDataLength
    );
    expect(firstTimeSeriesTrendDataLength).toBe(3);

    // 検証：timeSeriesTrendDataの具体値一致
    for (let i = 0; i < firstTimeSeriesTrendDataLength; i++) {
      const firstTrendPoint = firstAnalysisResult.timeSeriesTrendData[i];
      const secondTrendPoint = secondAnalysisResult.timeSeriesTrendData[i];

      expect(secondTrendPoint.date.getTime()).toBe(firstTrendPoint.date.getTime());
      expect(secondTrendPoint.occurrenceCount).toBe(firstTrendPoint.occurrenceCount);
      expect(secondTrendPoint.impactScore).toBe(firstTrendPoint.impactScore);
      expect(secondTrendPoint.resolutionRate).toBe(
        firstTrendPoint.resolutionRate
      );
    }

    // 検証：具体的なタイムシリーズデータの値チェック
    expect(firstAnalysisResult.timeSeriesTrendData[0].occurrenceCount).toBe(2);
    expect(firstAnalysisResult.timeSeriesTrendData[0].impactScore).toBe(60);
    expect(firstAnalysisResult.timeSeriesTrendData[0].resolutionRate).toBe(0);

    expect(firstAnalysisResult.timeSeriesTrendData[1].occurrenceCount).toBe(3);
    expect(firstAnalysisResult.timeSeriesTrendData[1].impactScore).toBe(70);
    expect(firstAnalysisResult.timeSeriesTrendData[1].resolutionRate).toBe(0);

    expect(firstAnalysisResult.timeSeriesTrendData[2].occurrenceCount).toBe(1);
    expect(firstAnalysisResult.timeSeriesTrendData[2].impactScore).toBe(65);
    expect(firstAnalysisResult.timeSeriesTrendData[2].resolutionRate).toBe(100);
  });
});