import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次レポート生成機能', () => {
  test('SCEN-2408: 開始日の形式が不正なとき処理が中断される', () => {
    // 不正な日付形式のパターンを検証する
    const invalidFormatPatterns = [
      '2024-13-45',  // 月と日が範囲外
      '2024/12/25',  // スラッシュ区切り（YYYY-MM-DD形式ではない）
      'invalid',     // 全く形式が異なる
    ];

    invalidFormatPatterns.forEach((invalidStartDate) => {
      // YYYY-MM-DD形式ではない開始日を入力した場合、エラーが発生する
      expect(() => {
        extractMonthlyReportData({
          targetYear: 2024,
          targetMonth: 12,
          requestedByUserId: 'user-001',
          startDate: invalidStartDate,
          endDate: '2024-12-31',
        });
      }).toThrow(/開始日/);
    });

    // 正規の ISO 8601 形式（YYYY-MM-DD）のみが受理される
    // この期待結果は、正しい形式では処理が進むことを暗に示す
    expect(() => {
      extractMonthlyReportData({
        targetYear: 2024,
        targetMonth: 12,
        requestedByUserId: 'user-001',
        startDate: '2024-12-01',
        endDate: '2024-12-31',
      });
    }).not.toThrow(/開始日/);
  });
});