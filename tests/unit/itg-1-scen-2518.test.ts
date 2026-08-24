import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信ビジネスロジック', () => {
  // SCEN-2518: [error] 初回テスト報告の入力検証 - 報告日時の形式が不正なとき入力検証エラーが返される
  test('報告日時の形式が不正な場合、入力検証エラーが返される', () => {
    const invalidReportDateFormats = [
      '2024-13-45',
      '2024/12/31 25:70:00',
      'yesterday',
      '2024-12-31T10:30:00Z', // ISO 8601 形式（YYYY-MM-DD HH:mm:ss を要求）
      '12/31/2024',
      '2024-12-31 25:00:00', // 時間が範囲外
      '2024-12-31 10:70:00', // 分が範囲外
      '2024-13-31 10:30:00', // 月が範囲外
      'not-a-date',
      '',
    ];

    invalidReportDateFormats.forEach((invalidReportDate) => {
      const submitInput = {
        userId: 'user-001',
        teamId: 'team-001',
        yesterdayAccomplishment: 'テスト作業完了',
        todayPlan: '機能開発',
        challenges: 'API連携',
        reportDate: invalidReportDate,
      };

      const result = submitDailyReport(submitInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors?.some((err) => /報告日時|形式/i.test(err))).toBe(
        true
      );
    });
  });
});