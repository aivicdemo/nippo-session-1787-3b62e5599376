import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次レポートデータ抽出機能', () => {
  // SCEN-2399
  test('開始日が終了日より後の日付で指定されたときバリデーションエラーが発生する', () => {
    const targetYear = 2026;
    const targetMonth = 12;
    const requestedByUserId = 'user-001';
    const aggregationStartDate = new Date('2026-12-31T00:00:00Z');
    const aggregationEndDate = new Date('2026-12-25T23:59:59Z');

    expect(() =>
      extractMonthlyReportData({
        targetYear,
        targetMonth,
        requestedByUserId,
        aggregationStartDate,
        aggregationEndDate,
      })
    ).toThrow(/開始日/);
  });
});