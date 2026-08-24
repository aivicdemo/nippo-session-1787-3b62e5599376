import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告集約分析機能 - 月次レポートデータ抽出', () => {
  // SCEN-2363
  test('集約期間の開始日が無効な日付形式のとき処理がエラーになる', () => {
    const invalidInput = {
      targetYear: 2026,
      targetMonth: 8,
      requestedByUserId: 'user-001',
      teamIdFilter: undefined,
      aggregationStartDate: '2026-13-45',
      aggregationEndDate: '2026-08-20',
    };

    expect(() => extractMonthlyReportData(invalidInput)).toThrow(/開始日/);
  });
});