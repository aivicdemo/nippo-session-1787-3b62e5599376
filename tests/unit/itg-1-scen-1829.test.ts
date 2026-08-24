import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import type { BottleneckAnalysisInput, IssueTimeSeriesRecord } from '../../src/logic/monthly-performance-analysis';

describe('月次ボトルネック分析 - 波及度スコア境界値判定', () => {
  test('SCEN-1829: 波及度スコア50.1は高程度ボトルネックに分類される', () => {
    // TextAnalysisServiceAdapterのモック化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockReturnValue(50.1),
      classifyIssueSeverity: jest.fn(),
    };

    // 分析対象期間: 2024年1月1日〜1月31日
    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const analysisEndDate = new Date('2024-01-31T23:59:59Z');

    // 波及度スコア50.1となる課題の時系列データを作成
    const issueTimeSeriesData: IssueTimeSeriesRecord[] = [
      {
        issueId: 'ISSUE-001',
        recordDate: new Date('2024-01-15T00:00:00Z'),
        occurrenceCount: 3,
        impactScore: 50.1,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'in_progress',
      },
    ];

    const input: BottleneckAnalysisInput = {
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      minimumDataPointsThreshold: 1,
      outlierDetectionEnabled: false,
    };

    // ボトルネック推移集計機能を実行
    const result = analyzeBottleneckTrendWithTimeSeries(input, mockTextAnalysisServiceAdapter);

    // 分類結果を確認: 波及度スコア50.1は高程度ボトルネック
    expect(result).toBeDefined();
    expect(result.issueId).toBe('ISSUE-001');
    expect(result.bottleneckSeverityScore).toBe(50.1);
    expect(result.bottleneckSeverityRank).toBe('high');
    expect(result.timeSeriesTrendData).toHaveLength(1);
    expect(result.timeSeriesTrendData[0].impactScore).toBe(50.1);
  });
});