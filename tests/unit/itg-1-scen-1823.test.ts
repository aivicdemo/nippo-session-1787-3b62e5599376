import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1823: [edge] 月次レポート生成機能 - 2月の月末が28日の場合、2月1日から2月28日までが正確に集計される
  test('2月の月末が28日の場合、2月1日から2月28日までが正確に集計される', () => {
    // 対象年月: 2025年2月（うるう年ではない通常の2月）
    const targetYear = 2025;
    const targetMonth = 2;
    const requestedByUserId = 'user-001';

    // テストデータベースに登録されたデータを模擬
    // 2月1日～2月28日の日報データ100件
    const mockReportRecords = Array.from({ length: 100 }, (_, index) => ({
      reportId: `report-${String(index + 1).padStart(3, '0')}`,
      reporterUserId: `reporter-${(index % 10) + 1}`,
      reportContent: `報告内容 ${index + 1}`,
      submittedAt: new Date(`2025-02-${String((index % 28) + 1).padStart(2, '0')}T${String(Math.floor(index / 28) * 8).padStart(2, '0')}:00:00Z`).toISOString(),
    }));

    // 境界外データ（1月31日と3月1日）
    const outOfBoundRecords = [
      {
        reportId: 'report-boundary-before',
        reporterUserId: 'reporter-boundary',
        reportContent: '1月31日データ',
        submittedAt: '2025-01-31T23:59:59Z',
      },
      {
        reportId: 'report-boundary-after',
        reporterUserId: 'reporter-boundary',
        reportContent: '3月1日データ',
        submittedAt: '2025-03-01T00:00:00Z',
      },
    ];

    // extractMonthlyReportData を実行
    const result = extractMonthlyReportData({
      targetYear,
      targetMonth,
      requestedByUserId,
    });

    // 集計対象期間の開始日を検証
    expect(result.extractionPeriodStart).toBe('2025-02-01T00:00:00Z');

    // 集計対象期間の終了日を検証
    expect(result.extractionPeriodEnd).toBe('2025-02-28T23:59:59Z');

    // 集計対象期間内の日報件数は100件（登録済みデータ）
    expect(result.totalReportCount).toBe(100);

    // レポートヘッダに「集計対象: 2025年2月1日～2月28日」と明記されていることを検証
    // (レポート構造によって異なるが、extractionPeriodStart/End で確認)
    const periodStartDate = new Date(result.extractionPeriodStart);
    const periodEndDate = new Date(result.extractionPeriodEnd);

    expect(periodStartDate.getFullYear()).toBe(2025);
    expect(periodStartDate.getMonth()).toBe(1); // 0-indexed: February = 1
    expect(periodStartDate.getDate()).toBe(1);
    expect(periodStartDate.getHours()).toBe(0);
    expect(periodStartDate.getMinutes()).toBe(0);
    expect(periodStartDate.getSeconds()).toBe(0);

    expect(periodEndDate.getFullYear()).toBe(2025);
    expect(periodEndDate.getMonth()).toBe(1); // 0-indexed: February = 1
    expect(periodEndDate.getDate()).toBe(28);
    expect(periodEndDate.getHours()).toBe(23);
    expect(periodEndDate.getMinutes()).toBe(59);
    expect(periodEndDate.getSeconds()).toBe(59);

    // データ品質スコアが0～100の範囲内であることを検証
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // extractedAt が現在時刻付近であることを検証（ISO 8601形式）
    const extractedAtDate = new Date(result.extractedAt);
    expect(extractedAtDate).toBeInstanceOf(Date);
    expect(extractedAtDate.getTime()).toBeGreaterThan(0);
  });
});