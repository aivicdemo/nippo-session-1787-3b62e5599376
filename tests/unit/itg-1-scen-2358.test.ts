import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告集約分析機能 - 月次報告データ抽出', () => {
  // SCEN-2358
  test('集約期間の終了日が指定されていないとき処理がエラーになる', () => {
    const targetYear = 2026;
    const targetMonth = 8;
    const requestedByUserId = 'user-001';
    const teamIdFilter = ['team-001'];

    const monthlyExtractionRequest = {
      targetYear,
      targetMonth,
      requestedByUserId,
      teamIdFilter,
    };

    expect(() => {
      extractMonthlyReportData(monthlyExtractionRequest);
    }).toThrow(/終了日/);
  });
});