import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次レポートデータ集約機能', () => {
  // SCEN-2398: [error] 日報データ集約・アーカイブ移行機能 - 集約期間の終了日が指定されていないとき処理が中断される
  test('should throw validation error when aggregation end date is missing', () => {
    const input = {
      targetYear: 2026,
      targetMonth: 1,
      requestedByUserId: 'user-001',
      teamIdFilter: ['team-001'],
      aggregationStartDate: '2026-01-01',
      aggregationEndDate: ''
    };

    expect(() => extractMonthlyReportData(input)).toThrow(/終了日|end date|required/i);
  });
});