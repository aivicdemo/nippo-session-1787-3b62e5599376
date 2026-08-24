import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import { type IssueTimeSeriesRecord, type BottleneckTrendAnalysisResult } from '../../src/logic/monthly-performance-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1960: [edge] 課題再発パターン時系列分析機能 - 日次分析で期間開始日と終了日の境界が正しく集計に含まれる
  test('期間開始日と終了日の境界データが正しく集計に含まれ、期間外データが除外される', () => {
    // 分析対象期間: 2026-01-01 00:00:00 ～ 2026-01-31 23:59:59
    const analysisStartDate = new Date('2026-01-01T00:00:00Z');
    const analysisEndDate = new Date('2026-01-31T23:59:59Z');

    // テストデータ: 期間内3件 + 期間外2件
    const issueTimeSeriesData: IssueTimeSeriesRecord[] = [
      {
        issueId: 'issue-login-001',
        recordDate: new Date('2025-12-31T12:00:00Z'), // 期間外（開始日の前日）
        occurrenceCount: 1,
        impactScore: 50,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-login-001',
        recordDate: new Date('2026-01-01T00:00:00Z'), // 期間内（開始日）
        occurrenceCount: 1,
        impactScore: 75,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-login-001',
        recordDate: new Date('2026-01-15T12:00:00Z'), // 期間内（中間）
        occurrenceCount: 1,
        impactScore: 60,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'in_progress',
      },
      {
        issueId: 'issue-login-001',
        recordDate: new Date('2026-01-31T23:59:59Z'), // 期間内（終了日）
        occurrenceCount: 1,
        impactScore: 80,
        resolutionDaysElapsed: 0,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'issue-login-001',
        recordDate: new Date('2026-02-01T12:00:00Z'), // 期間外（終了日の翌日）
        occurrenceCount: 1,
        impactScore: 55,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'closed',
      },
    ];

    // 分析実行
    const result: BottleneckTrendAnalysisResult = analyzeBottleneckTrendWithTimeSeries(
      'issue-login-001',
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData
    );

    // 期間内のデータ件数を検証: 3件（開始日1件 + 中間1件 + 終了日1件）
    expect(result.timeSeriesTrendData).toHaveLength(3);

    // 期間内の影響度スコア合計を検証: 75 + 60 + 80 = 215
    const totalImpactScore = result.timeSeriesTrendData.reduce(
      (sum, point) => sum + point.impactScore,
      0
    );
    expect(totalImpactScore).toBe(215);

    // 時系列データの日付が正しく含まれていることを検証
    const dates = result.timeSeriesTrendData.map((point) => point.date.toISOString());
    expect(dates).toContain('2026-01-01T00:00:00.000Z');
    expect(dates).toContain('2026-01-15T12:00:00.000Z');
    expect(dates).toContain('2026-01-31T23:59:59.000Z');

    // 期間外のデータが除外されていることを検証
    const allDates = result.timeSeriesTrendData.map((point) => point.date);
    const hasDateBefore = allDates.some((date) => date < analysisStartDate);
    const hasDateAfter = allDates.some((date) => date > analysisEndDate);
    expect(hasDateBefore).toBe(false);
    expect(hasDateAfter).toBe(false);

    // 各日のoccurrenceCountを検証: すべて1件ずつ
    result.timeSeriesTrendData.forEach((point) => {
      expect(point.occurrenceCount).toBe(1);
    });

    // ボトルネック深刻度スコアが計算されていることを検証
    expect(result.bottleneckSeverityScore).toBeGreaterThanOrEqual(0);
    expect(result.bottleneckSeverityScore).toBeLessThanOrEqual(100);

    // ボトルネック深刻度ランクが設定されていることを検証
    expect(['critical', 'high', 'medium', 'low']).toContain(
      result.bottleneckSeverityRank
    );

    // 改善傾向が設定されていることを検証
    expect(['improving', 'stable', 'deteriorating']).toContain(
      result.improvementTrend
    );

    // 平均解決日数が計算されていることを検証
    expect(result.averageResolutionDays).toBeGreaterThanOrEqual(0);

    // ピーク発生日が期間内に含まれていることを検証
    expect(result.peakOccurrenceDate).toBeInstanceOf(Date);
    expect(result.peakOccurrenceDate >= analysisStartDate).toBe(true);
    expect(result.peakOccurrenceDate <= analysisEndDate).toBe(true);
  });
});