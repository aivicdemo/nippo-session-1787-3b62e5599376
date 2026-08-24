import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import { type IssueTimeSeriesRecord, type BottleneckTrendAnalysisResult } from '../../src/logic/monthly-performance-analysis';

describe('課題再発パターン時系列分析機能 - 週次分析での期間集計', () => {
  test('SCEN-1964: 週次分析で月曜から日曜の範囲が正確に集計される', () => {
    // 分析対象期間: 2026-08-24(月) ～ 2026-08-30(日)
    const analysisStartDate = new Date('2026-08-24T00:00:00Z');
    const analysisEndDate = new Date('2026-08-30T23:59:59Z');
    const issueId = 'ISSUE-001';

    // テストデータ: 'DB接続エラー' の発生パターン
    // 月曜(2026-08-24): 2件
    // 水曜(2026-08-26): 1件
    // 金曜(2026-08-28): 3件
    // 日曜(2026-08-30): 2件
    const issueTimeSeriesData: IssueTimeSeriesRecord[] = [
      {
        issueId,
        recordDate: new Date('2026-08-24'),
        occurrenceCount: 2,
        impactScore: 45,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'open'
      },
      {
        issueId,
        recordDate: new Date('2026-08-26'),
        occurrenceCount: 1,
        impactScore: 35,
        resolutionDaysElapsed: 0,
        resolutionStatus: 'open'
      },
      {
        issueId,
        recordDate: new Date('2026-08-28'),
        occurrenceCount: 3,
        impactScore: 60,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'in_progress'
      },
      {
        issueId,
        recordDate: new Date('2026-08-30'),
        occurrenceCount: 2,
        impactScore: 40,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'open'
      }
    ];

    // 分析実行
    const result = analyzeBottleneckTrendWithTimeSeries(
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      7,
      true
    ) as BottleneckTrendAnalysisResult;

    // 検証1: 分析期間が正確に設定されていること
    expect(result.issueId).toBe(issueId);

    // 検証2: 時系列データが日別に集計されていること
    expect(result.timeSeriesTrendData).toBeDefined();
    expect(result.timeSeriesTrendData.length).toBe(4); // 月、水、金、日の4日分

    // 月曜(2026-08-24)のデータ検証
    const mondayData = result.timeSeriesTrendData.find(
      (d) => d.date.getTime() === new Date('2026-08-24').getTime()
    );
    expect(mondayData).toBeDefined();
    expect(mondayData!.occurrenceCount).toBe(2);
    expect(mondayData!.impactScore).toBe(45);

    // 水曜(2026-08-26)のデータ検証
    const wednesdayData = result.timeSeriesTrendData.find(
      (d) => d.date.getTime() === new Date('2026-08-26').getTime()
    );
    expect(wednesdayData).toBeDefined();
    expect(wednesdayData!.occurrenceCount).toBe(1);
    expect(wednesdayData!.impactScore).toBe(35);

    // 金曜(2026-08-28)のデータ検証
    const fridayData = result.timeSeriesTrendData.find(
      (d) => d.date.getTime() === new Date('2026-08-28').getTime()
    );
    expect(fridayData).toBeDefined();
    expect(fridayData!.occurrenceCount).toBe(3);
    expect(fridayData!.impactScore).toBe(60);

    // 日曜(2026-08-30)のデータ検証
    const sundayData = result.timeSeriesTrendData.find(
      (d) => d.date.getTime() === new Date('2026-08-30').getTime()
    );
    expect(sundayData).toBeDefined();
    expect(sundayData!.occurrenceCount).toBe(2);
    expect(sundayData!.impactScore).toBe(40);

    // 検証3: 合計出現件数が8件（2+1+3+2）であること
    const totalOccurrenceCount = result.timeSeriesTrendData.reduce(
      (sum, d) => sum + d.occurrenceCount,
      0
    );
    expect(totalOccurrenceCount).toBe(8);

    // 検証4: ボトルネック深刻度スコアが計算されていること
    expect(result.bottleneckSeverityScore).toBeGreaterThan(0);
    expect(result.bottleneckSeverityScore).toBeLessThanOrEqual(100);

    // 検証5: 平均解決日数が計算されていること
    expect(result.averageResolutionDays).toBeGreaterThanOrEqual(0);

    // 検証6: ピーク発生日が金曜（2026-08-28）であること（出現件数が最多）
    expect(result.peakOccurrenceDate.getTime()).toBe(
      new Date('2026-08-28').getTime()
    );

    // 検証7: 改善傾向が判定されていること
    expect(['improving', 'stable', 'deteriorating']).toContain(
      result.improvementTrend
    );

    // 検証8: ボトルネック深刻度ランクが判定されていること
    expect(['critical', 'high', 'medium', 'low']).toContain(
      result.bottleneckSeverityRank
    );
  });
});