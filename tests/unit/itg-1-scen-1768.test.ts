import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成 - データ抽出処理', () => {
  // SCEN-1768: [error] 月次レポート生成（データ抽出処理） - 抽出終了日時が不正なフォーマット（無効な日付文字列）の場合、エラーが発生して処理が中断される
  test('抽出終了日時が無効なフォーマットの場合、エラーメッセージが表示されて処理が中断される', () => {
    const validStartDate = '2026-01-01';
    const invalidEndDate = '2026-13-45';
    const targetYear = 2026;
    const targetMonth = 1;
    const requestedByUserId = 'user-001';

    expect(() => {
      extractMonthlyReportData({
        targetYear,
        targetMonth,
        requestedByUserId,
        extractionPeriodStart: validStartDate,
        extractionPeriodEnd: invalidEndDate,
      });
    }).toThrow(/抽出終了日時の形式が無効/);
  });
});