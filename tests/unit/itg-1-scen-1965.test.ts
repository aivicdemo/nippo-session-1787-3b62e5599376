import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import type { IssueTimeSeriesRecord, BottleneckTrendAnalysisResult, TextAnalysisServiceAdapter } from '../../src/logic/monthly-performance-analysis';

describe('月次分析での課題再発パターン時系列分析', () => {
  // SCEN-1965: [edge] 課題再発パターン時系列分析機能 - 月の初日から末日までが正確に集計される
  test('2026年1月の月次分析で初日と末日を含む全レコードが正確に集計される', () => {
    // テスト用の課題再発レコード生成（2026年1月1日～31日）
    const issueTimeSeriesRecords: IssueTimeSeriesRecord[] = [
      {
        issueId: 'issue-db-001',
        recordDate: new Date('2026-01-01'),
        occurrenceCount: 1,
        impactScore: 85,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-db-001',
        recordDate: new Date('2026-01-05'),
        occurrenceCount: 1,
        impactScore: 80,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-cache-001',
        recordDate: new Date('2026-01-10'),
        occurrenceCount: 1,
        impactScore: 70,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'in_progress',
      },
      {
        issueId: 'issue-db-001',
        recordDate: new Date('2026-01-15'),
        occurrenceCount: 1,
        impactScore: 75,
        resolutionDaysElapsed: 4,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-timeout-001',
        recordDate: new Date('2026-01-20'),
        occurrenceCount: 1,
        impactScore: 90,
        resolutionDaysElapsed: 5,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'issue-cache-001',
        recordDate: new Date('2026-01-28'),
        occurrenceCount: 1,
        impactScore: 65,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'closed',
      },
      {
        issueId: 'issue-db-001',
        recordDate: new Date('2026-01-31'),
        occurrenceCount: 1,
        impactScore: 82,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'open',
      },
    ];

    // TextAnalysisServiceAdapterのモック化
    const mockTextAnalysisServiceAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn((issueContent: string) => {
        // issueIdに基づいてキーワードを返す
        if (issueContent.includes('issue-db-001')) {
          return { keywords: ['DB接続エラー'], frequency: 1 };
        }
        if (issueContent.includes('issue-cache-001')) {
          return { keywords: ['キャッシュミス'], frequency: 1 };
        }
        if (issueContent.includes('issue-timeout-001')) {
          return { keywords: ['タイムアウト'], frequency: 1 };
        }
        return { keywords: [], frequency: 0 };
      }),
      assessImpactScore: jest.fn((content: string) => {
        return 75;
      }),
      classifyIssueSeverity: jest.fn((content: string) => {
        return 'high';
      }),
    };

    // 月次分析実行（2026年1月）
    const analysisStartDate = new Date('2026-01-01T00:00:00Z');
    const analysisEndDate = new Date('2026-01-31T23:59:59Z');

    const result: BottleneckTrendAnalysisResult = analyzeBottleneckTrendWithTimeSeries(
      {
        analysisStartDate,
        analysisEndDate,
        issueTimeSeriesData: issueTimeSeriesRecords,
        minimumDataPointsThreshold: 7,
        outlierDetectionEnabled: true,
      },
      mockTextAnalysisServiceAdapter,
    );

    // 集計期間の確認
    expect(result.analysisStartDate).toEqual(analysisStartDate);
    expect(result.analysisEndDate).toEqual(analysisEndDate);

    // 課題別の出現頻度確認（月の初日と末日を含む）
    expect(result.issueFrequencyByKeyword).toBeDefined();
    expect(result.issueFrequencyByKeyword['DB接続エラー']).toBe(4); // 1/1, 1/5, 1/15, 1/31
    expect(result.issueFrequencyByKeyword['キャッシュミス']).toBe(2); // 1/10, 1/28
    expect(result.issueFrequencyByKeyword['タイムアウト']).toBe(1); // 1/20

    // 全レコード集計数の確認（7件すべてが処理されている）
    expect(result.totalDataPointsProcessed).toBe(7);

    // 時系列トレンドデータの確認
    expect(result.timeSeriesTrendData).toBeDefined();
    expect(result.timeSeriesTrendData.length).toBe(7);

    // 最初のレコード（1/1）が含まれていることの確認
    const firstRecord = result.timeSeriesTrendData[0];
    expect(firstRecord.date).toEqual(new Date('2026-01-01'));
    expect(firstRecord.occurrenceCount).toBe(1);
    expect(firstRecord.impactScore).toBe(85);

    // 最後のレコード（1/31）が含まれていることの確認
    const lastRecord = result.timeSeriesTrendData[6];
    expect(lastRecord.date).toEqual(new Date('2026-01-31'));
    expect(lastRecord.occurrenceCount).toBe(1);
    expect(lastRecord.impactScore).toBe(82);

    // TextAnalysisServiceAdapterが7回呼び出されたことの確認
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(7);
  });
});