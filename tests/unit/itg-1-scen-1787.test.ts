import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractMonthlyReportData, type MonthlyReportDataset } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能 - 前月日報0件の場合', () => {
  // SCEN-1787
  test('前月の日報が0件の場合、空の集計結果でレポートが生成される', async () => {
    // Arrange: テスト対象月の前月における日報データを0件として構成
    const targetYear = 2024;
    const targetMonth = 2; // 2月を対象月とする（前月は1月）
    const requestedByUserId = 'user-dept-chief-001';
    const teamIdFilter = undefined; // 全チーム対象

    // 前月（1月）の日報データは0件を想定
    const previousMonthReportCount = 0;

    // Act: 月次レポート生成機能を実行
    const result: MonthlyReportDataset = await extractMonthlyReportData({
      targetYear,
      targetMonth,
      requestedByUserId,
      teamIdFilter,
    });

    // Assert: 生成されたレポートの構造を検証
    expect(result).not.toBeNull();
    expect(result).toBeDefined();

    // レポートの集計結果セクションを確認：すべての項目が0またはnull値であることを検証
    expect(result.totalReportCount).toBe(0);

    // チーム別集計結果も0件であることを確認
    expect(result.reportsByTeam).toBeDefined();
    expect(Array.isArray(result.reportsByTeam)).toBe(true);
    expect(result.reportsByTeam.length).toBe(0);

    // データ品質スコアを確認（データが0件の場合の品質スコア）
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // 抽出期間メタデータが正しく設定されていることを確認
    expect(result.extractionPeriodStart).toBeDefined();
    expect(result.extractionPeriodEnd).toBeDefined();

    // 抽出期間が対象月の範囲内であることを確認
    const periodStart = new Date(result.extractionPeriodStart);
    const periodEnd = new Date(result.extractionPeriodEnd);

    // 2月は対象月なので、2024年2月1日00:00:00から2月末日23:59:59までの範囲を想定
    const expectedStart = new Date(`2024-02-01T00:00:00Z`);
    const expectedEnd = new Date(`2024-02-29T23:59:59Z`);

    expect(periodStart.getFullYear()).toBe(expectedStart.getFullYear());
    expect(periodStart.getMonth()).toBe(expectedStart.getMonth());
    expect(periodStart.getDate()).toBe(expectedStart.getDate());

    expect(periodEnd.getFullYear()).toBe(expectedEnd.getFullYear());
    expect(periodEnd.getMonth()).toBe(expectedEnd.getMonth());

    // データ抽出実行日時が記録されていることを確認
    expect(result.extractedAt).toBeDefined();
    const extractedAt = new Date(result.extractedAt);
    expect(extractedAt).toBeInstanceOf(Date);
    expect(extractedAt.getTime()).toBeGreaterThan(0);

    // レポートの統合検証：すべての項目が期待値（0またはnull）であることを最終確認
    expect(result.totalReportCount).toBe(previousMonthReportCount);
  });
});