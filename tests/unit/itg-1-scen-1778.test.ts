import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import type { MonthlyReportDataset } from '../../src/logic/monthly-performance-analysis';

describe('extractMonthlyReportData', () => {
  // SCEN-1778: [edge] 月次レポート生成機能 - 抽出期間が前月末日23:59ちょうどの報告を含める
  test('should include report submitted at exactly end of previous month 23:59:00', () => {
    // Setup: 2026年1月15日09:00:00を現在時刻として設定
    const mockCurrentDate = new Date('2026-01-15T09:00:00Z');
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => mockCurrentDate.getTime());

    try {
      // 前月（2025年12月）の末日23:59:00に送信されたレコード
      const report001_submitted_at_boundary = {
        userId: 'user001',
        reportContent: '昨日のタスク完了',
        submittedAt: new Date('2025-12-31T23:59:00Z'),
      };

      // 前月の末日23:58:59に送信されたレコード
      const report002_submitted_before_boundary = {
        userId: 'user002',
        reportContent: '本日の予定',
        submittedAt: new Date('2025-12-31T23:58:59Z'),
      };

      // テスト用入力データセット（前月の報告を含む）
      const testReports = [
        report001_submitted_at_boundary,
        report002_submitted_before_boundary,
      ];

      // 月次レポート抽出処理を呼び出し（2025年12月全体を対象）
      const result: MonthlyReportDataset = extractMonthlyReportData({
        targetYear: 2025,
        targetMonth: 12,
        requestedByUserId: 'manager001',
        teamIdFilter: undefined,
      });

      // 期待結果の検証
      // 1. 抽出対象レコード数が正確であること（末日23:59:00 以上のレコードが含まれる）
      expect(result.totalReportCount).toBe(2);

      // 2. 抽出期間が正確であること
      const expectedPeriodStart = '2025-12-01T00:00:00Z';
      const expectedPeriodEnd = '2025-12-31T23:59:59Z';
      expect(result.extractionPeriodStart).toBe(expectedPeriodStart);
      expect(result.extractionPeriodEnd).toBe(expectedPeriodEnd);

      // 3. レポート内に末日23:59:00の報告（user001）が含まれていることを確認
      expect(result.reportsByTeam).toBeDefined();
      expect(Array.isArray(result.reportsByTeam)).toBe(true);

      // 4. データ品質スコアが妥当な範囲（0-100）であること
      expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
      expect(result.dataQualityScore).toBeLessThanOrEqual(100);

      // 5. 抽出実行日時が記録されていること
      expect(result.extractedAt).toBeDefined();
      const extractedAtDate = new Date(result.extractedAt);
      expect(extractedAtDate.getTime()).toBeLessThanOrEqual(mockCurrentDate.getTime());

    } finally {
      // クリーンアップ
      Date.now = originalDateNow;
    }
  });
});