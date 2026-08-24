import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次レポート生成機能', () => {
  // SCEN-1798
  test('日報データテーブルが空配列の状態でレポート生成するとエラーになる', () => {
    const emptyDailyReports: never[] = [];
    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = 'user-001';

    expect(() => {
      extractMonthlyReportData({
        dailyReports: emptyDailyReports,
        targetYear: targetYear,
        targetMonth: targetMonth,
        requestedByUserId: requestedByUserId,
      });
    }).toThrow(/レポート生成に必要な日報データが存在しません/);
  });
});