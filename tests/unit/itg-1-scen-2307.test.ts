import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type {
  TeamPerformanceMetricsInput,
  TeamPerformanceMetricsOutput,
  DailyReportRecord,
} from '../../src/logic/monthly-performance-analysis';

describe('課題解決速度計算機能 - 1000件規模データ処理', () => {
  // SCEN-2307
  test('1000件の課題データについて解決速度が正しく計算される', () => {
    // テスト用の 1000 件の課題データセットを生成
    const dailyReportRecords: DailyReportRecord[] = [];
    const baseDate = new Date('2024-01-01T09:00:00Z');

    for (let i = 0; i < 1000; i++) {
      const reportedDate = new Date(baseDate.getTime() + i * 86400000); // 1日単位でずらす
      const resolutionDaysElapsed = Math.floor(Math.random() * 10) + 1; // 1～10日のランダム解決日数
      const resolvedDate = new Date(reportedDate.getTime() + resolutionDaysElapsed * 86400000);

      dailyReportRecords.push({
        reportId: `report-${i}`,
        reportedDate,
        resolvedDate,
        resolutionDaysElapsed,
        issueStatus: 'resolved',
        issueKeyword: `issue-keyword-${i % 50}`, // 50種類のキーワードを繰り返す
        impactScore: Math.floor(Math.random() * 100) + 1, // 1～100のランダムスコア
        teamId: 'team-001',
      });
    }

    // テスト入力データを構築
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-04-10T23:59:59Z');
    const teamIds = ['team-001'];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportDataset: dailyReportRecords,
    };

    // 計算処理を実行
    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);

    // アサーション: 結果が返却されていることを確認
    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(Array.isArray(result.teamMetrics)).toBe(true);

    // アサーション: チーム数が正確に返却されていることを確認
    expect(result.teamMetrics.length).toBe(1);

    const teamMetric = result.teamMetrics[0];

    // アサーション: チームIDが正確であることを確認
    expect(teamMetric.teamId).toBe('team-001');

    // アサーション: 解決速度が計算されていることを確認
    expect(teamMetric.issueResolutionSpeed).toBeDefined();
    expect(typeof teamMetric.issueResolutionSpeed).toBe('number');

    // 手動で期待値を計算: 全1000件の平均解決日数
    const totalResolutionDays = dailyReportRecords.reduce(
      (sum, record) => sum + (record.resolutionDaysElapsed || 0),
      0
    );
    const expectedAverageResolutionDays = totalResolutionDays / dailyReportRecords.length;

    // アサーション: 計算された解決速度が期待値と一致することを確認（小数第2位まで）
    expect(teamMetric.issueResolutionSpeed).toBeCloseTo(
      expectedAverageResolutionDays,
      2
    );

    // アサーション: 報告提出率が0～100の範囲内であることを確認
    expect(teamMetric.reportSubmissionRate).toBeGreaterThanOrEqual(0);
    expect(teamMetric.reportSubmissionRate).toBeLessThanOrEqual(100);

    // アサーション: 課題再発率が0～100の範囲内であることを確認
    expect(teamMetric.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
    expect(teamMetric.issueRecurrenceRate).toBeLessThanOrEqual(100);

    // アサーション: 優先度スコアが1～100の範囲内であることを確認
    expect(teamMetric.priorityScore).toBeGreaterThanOrEqual(1);
    expect(teamMetric.priorityScore).toBeLessThanOrEqual(100);

    // アサーション: 集計期間が正確に記録されていることを確認
    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);

    // アサーション: データ品質スコアが0～100の範囲内であることを確認
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // アサーション: 異常値検出結果が含まれていることを確認
    expect(result.outlierDetectionResult).toBeDefined();
    expect(typeof result.outlierDetectionResult.isAnomalousData).toBe('boolean');

    // アサーション: 計算結果が業務時間単位で正確に表記されていることを確認
    // 解決速度は日単位で表現されることを確認
    expect(Number.isFinite(teamMetric.issueResolutionSpeed)).toBe(true);
    expect(teamMetric.issueResolutionSpeed).toBeGreaterThan(0);

    // アサーション: チーム名が設定されていることを確認
    expect(teamMetric.teamName).toBeDefined();
    expect(typeof teamMetric.teamName).toBe('string');
  });
});