import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import { type BottleneckAnalysisInput, type IssueTimeSeriesRecord } from '../../src/logic/monthly-performance-analysis';

describe('月次期間の課題再発パターン時系列分析 - 空データ', () => {
  test('SCEN-1947: 課題データが0件の場合、空の集計結果が返される', () => {
    // 分析対象期間: 当月1日～末日
    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const analysisEndDate = new Date('2024-01-31T23:59:59Z');

    // 課題データが0件のシナリオ
    const issueTimeSeriesData: IssueTimeSeriesRecord[] = [];

    // テスト入力
    const input: BottleneckAnalysisInput = {
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      minimumDataPointsThreshold: 7,
      outlierDetectionEnabled: true,
    };

    // 分析実行
    const result = analyzeBottleneckTrendWithTimeSeries(input);

    // 期待結果の検証: 課題データ0件の場合、空の集計結果が返される
    expect(result).toEqual({
      period: '2024-01',
      totalIssueCount: 0,
      recurrencePatterns: [],
      timeSeriesData: [],
      aggregationStatus: 'empty',
    });

    // 戻り値にエラーが含まれないことを確認
    expect(result).not.toHaveProperty('error');

    // 構造検証: すべての必須フィールドが存在すること
    expect(result).toHaveProperty('period');
    expect(result).toHaveProperty('totalIssueCount');
    expect(result).toHaveProperty('recurrencePatterns');
    expect(result).toHaveProperty('timeSeriesData');
    expect(result).toHaveProperty('aggregationStatus');

    // 型検証
    expect(typeof result.period).toBe('string');
    expect(typeof result.totalIssueCount).toBe('number');
    expect(Array.isArray(result.recurrencePatterns)).toBe(true);
    expect(Array.isArray(result.timeSeriesData)).toBe(true);
    expect(typeof result.aggregationStatus).toBe('string');

    // 期間フォーマット検証
    expect(result.period).toMatch(/^\d{4}-\d{2}$/);
  });
});