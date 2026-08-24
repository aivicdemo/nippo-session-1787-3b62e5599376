import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import { type IssueTimeSeriesRecord, type BottleneckTrendAnalysisResult } from '../../src/logic/monthly-performance-analysis';

describe('課題再発パターン時系列分析機能', () => {
  // SCEN-1961: [edge] 月末日を含む分析期間で月をまたぐ課題データが正しく分類される
  test('月末日（1月31日）から月初日（2月1日）を含む分析期間で、月をまたぐ再発パターンが正しく分類される', () => {
    // 分析期間: 2024年1月31日～2024年2月29日
    const analysisStartDate = new Date('2024-01-31T00:00:00Z');
    const analysisEndDate = new Date('2024-02-29T23:59:59Z');

    // テスト用時系列データ
    const issueTimeSeriesData: IssueTimeSeriesRecord[] = [
      // 課題A: 2024年1月31日に初発
      {
        issueId: 'issue-a-initial',
        recordDate: new Date('2024-01-31T00:00:00Z'),
        occurrenceCount: 2,
        impactScore: 75,
        resolutionDaysElapsed: 0,
        resolutionStatus: 'open'
      },
      // 課題B: 2024年2月1日に初発（月またぎ）
      {
        issueId: 'issue-b-initial',
        recordDate: new Date('2024-02-01T00:00:00Z'),
        occurrenceCount: 1,
        impactScore: 45,
        resolutionDaysElapsed: 0,
        resolutionStatus: 'open'
      },
      // 課題A（再発）: 2024年2月15日に再発
      {
        issueId: 'issue-a-recurrence',
        recordDate: new Date('2024-02-15T00:00:00Z'),
        occurrenceCount: 1,
        impactScore: 60,
        resolutionDaysElapsed: 15,
        resolutionStatus: 'in_progress'
      }
    ];

    // 分析実行
    const result = analyzeBottleneckTrendWithTimeSeries(
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      7,
      true
    );

    // 期待値の検証

    // 1. 結果オブジェクトが返される
    expect(result).toBeDefined();
    expect(result.issueId).toBeDefined();
    expect(result.bottleneckSeverityRank).toBeDefined();
    expect(result.bottleneckSeverityScore).toBeGreaterThanOrEqual(0);
    expect(result.bottleneckSeverityScore).toBeLessThanOrEqual(100);
    expect(result.improvementTrend).toMatch(/improving|stable|deteriorating/);
    expect(result.averageResolutionDays).toBeGreaterThanOrEqual(0);
    expect(result.peakOccurrenceDate).toBeInstanceOf(Date);
    expect(result.timeSeriesTrendData).toBeDefined();
    expect(Array.isArray(result.timeSeriesTrendData)).toBe(true);

    // 2. 月末日と月初日を含むデータが時系列順に正しく並べられている
    expect(result.timeSeriesTrendData.length).toBeGreaterThan(0);
    for (let i = 0; i < result.timeSeriesTrendData.length - 1; i++) {
      const currentDate = result.timeSeriesTrendData[i].date.getTime();
      const nextDate = result.timeSeriesTrendData[i + 1].date.getTime();
      expect(currentDate).toBeLessThanOrEqual(nextDate);
    }

    // 3. 月末日（1月31日）のデータが最初に含まれている
    const hasJanuary31 = result.timeSeriesTrendData.some(
      point =>
        point.date.getFullYear() === 2024 &&
        point.date.getMonth() === 0 &&
        point.date.getDate() === 31
    );
    expect(hasJanuary31).toBe(true);

    // 4. 月初日（2月1日）のデータが含まれている
    const hasFebruary1 = result.timeSeriesTrendData.some(
      point =>
        point.date.getFullYear() === 2024 &&
        point.date.getMonth() === 1 &&
        point.date.getDate() === 1
    );
    expect(hasFebruary1).toBe(true);

    // 5. 月をまたぐ日付の順序が正しい
    const jan31Index = result.timeSeriesTrendData.findIndex(
      point =>
        point.date.getFullYear() === 2024 &&
        point.date.getMonth() === 0 &&
        point.date.getDate() === 31
    );
    const feb1Index = result.timeSeriesTrendData.findIndex(
      point =>
        point.date.getFullYear() === 2024 &&
        point.date.getMonth() === 1 &&
        point.date.getDate() === 1
    );
    expect(jan31Index).toBeGreaterThanOrEqual(0);
    expect(feb1Index).toBeGreaterThanOrEqual(0);
    expect(jan31Index).toBeLessThan(feb1Index);

    // 6. 各データポイントの整合性を検証
    result.timeSeriesTrendData.forEach(point => {
      expect(point.date).toBeInstanceOf(Date);
      expect(point.occurrenceCount).toBeGreaterThanOrEqual(0);
      expect(point.impactScore).toBeGreaterThanOrEqual(0);
      expect(point.impactScore).toBeLessThanOrEqual(100);
      expect(point.resolutionRate).toBeGreaterThanOrEqual(0);
      expect(point.resolutionRate).toBeLessThanOrEqual(100);
    });

    // 7. ボトルネック深刻度スコアが妥当な範囲内
    expect(result.bottleneckSeverityScore).toBeGreaterThanOrEqual(0);
    expect(result.bottleneckSeverityScore).toBeLessThanOrEqual(100);

    // 8. ボトルネック深刻度ランクが有効な値のいずれかである
    const validRanks = ['critical', 'high', 'medium', 'low'];
    expect(validRanks).toContain(result.bottleneckSeverityRank);

    // 9. 改善傾向が有効な値のいずれかである
    const validTrends = ['improving', 'stable', 'deteriorating'];
    expect(validTrends).toContain(result.improvementTrend);

    // 10. ピーク発生日が分析期間内である
    expect(result.peakOccurrenceDate.getTime()).toBeGreaterThanOrEqual(
      analysisStartDate.getTime()
    );
    expect(result.peakOccurrenceDate.getTime()).toBeLessThanOrEqual(
      analysisEndDate.getTime()
    );

    // 11. 平均解決日数が非負の値である
    expect(result.averageResolutionDays).toBeGreaterThanOrEqual(0);
  });
});