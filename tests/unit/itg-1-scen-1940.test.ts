import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import { type IssueTimeSeriesRecord } from '../../src/logic/monthly-performance-analysis';

describe('課題再発パターン時系列分析 - 日次集計', () => {
  // SCEN-1940
  test('should aggregate multiple issue keywords by date when analyzing time series data with daily granularity', () => {
    const analysisStartDate = new Date('2026-08-20T00:00:00Z');
    const analysisEndDate = new Date('2026-08-20T23:59:59Z');

    const issueTimeSeriesData: IssueTimeSeriesRecord[] = [
      {
        issueId: 'issue-001-db-error',
        recordDate: new Date('2026-08-20'),
        occurrenceCount: 1,
        impactScore: 75,
        resolutionDaysElapsed: 0,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-002-api-delay',
        recordDate: new Date('2026-08-20'),
        occurrenceCount: 1,
        impactScore: 60,
        resolutionDaysElapsed: 0,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-003-db-error-2nd',
        recordDate: new Date('2026-08-20'),
        occurrenceCount: 1,
        impactScore: 72,
        resolutionDaysElapsed: 0,
        resolutionStatus: 'open',
      },
    ];

    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn((reportText: string) => {
        if (reportText.includes('データベース接続エラー')) {
          return {
            keywords: ['データベース接続エラー'],
            frequency: 1,
            confidence: 0.95,
          };
        }
        if (reportText.includes('APIレスポンス遅延')) {
          return {
            keywords: ['APIレスポンス遅延'],
            frequency: 1,
            confidence: 0.92,
          };
        }
        return { keywords: [], frequency: 0, confidence: 0 };
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        if (keyword === 'データベース接続エラー') return 74;
        if (keyword === 'APIレスポンス遅延') return 61;
        return 50;
      }),
      classifyIssueSeverity: jest.fn((keyword: string) => {
        if (keyword === 'データベース接続エラー') return 'high';
        if (keyword === 'APIレスポンス遅延') return 'medium';
        return 'low';
      }),
    };

    const dailyReportRecords = [
      {
        reportId: 'report-001',
        submittedAt: new Date('2026-08-20T09:00:00Z'),
        reportText: '昨日：データベース接続エラーが発生した。今日：対応を継続する。課題：データベース接続エラーの根本原因特定が必要。',
        teamId: 'team-001',
        memberId: 'member-001',
      },
      {
        reportId: 'report-002',
        submittedAt: new Date('2026-08-20T09:15:00Z'),
        reportText: '昨日：APIレスポンス遅延を確認した。今日：キャッシュ機構の検証を行う。課題：APIレスポンス遅延の性能改善が必要。',
        teamId: 'team-001',
        memberId: 'member-002',
      },
      {
        reportId: 'report-003',
        submittedAt: new Date('2026-08-20T09:30:00Z'),
        reportText: '昨日：データベース接続エラーが再度発生した。今日：詳細ログを解析する。課題：データベース接続エラーの根本原因がまだ不明。',
        teamId: 'team-001',
        memberId: 'member-003',
      },
    ];

    const result = analyzeBottleneckTrendWithTimeSeries(
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      textAnalysisServiceAdapterStub as any,
      dailyReportRecords as any
    );

    expect(result).toBeDefined();
    expect(result.timeSeriesTrendData).toBeDefined();
    expect(Array.isArray(result.timeSeriesTrendData)).toBe(true);

    const trendDataForDate = result.timeSeriesTrendData.find(
      (trend: any) =>
        trend.date.toISOString().split('T')[0] === '2026-08-20'
    );

    expect(trendDataForDate).toBeDefined();

    if (trendDataForDate && trendDataForDate.issueAggregation) {
      const aggregation = trendDataForDate.issueAggregation;

      const databaseErrorEntry = aggregation.find(
        (item: any) => item.keyword === 'データベース接続エラー'
      );
      expect(databaseErrorEntry).toBeDefined();
      expect(databaseErrorEntry.occurrenceCount).toBe(2);

      const apiDelayEntry = aggregation.find(
        (item: any) => item.keyword === 'APIレスポンス遅延'
      );
      expect(apiDelayEntry).toBeDefined();
      expect(apiDelayEntry.occurrenceCount).toBe(1);

      expect(aggregation.length).toBe(2);
    }

    expect(result.bottleneckSeverityScore).toBeGreaterThanOrEqual(0);
    expect(result.bottleneckSeverityScore).toBeLessThanOrEqual(100);
    expect(result.averageResolutionDays).toBeGreaterThanOrEqual(0);
    expect(
      ['improving', 'stable', 'deteriorating'].includes(
        result.improvementTrend
      )
    ).toBe(true);
  });
});