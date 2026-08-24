import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次レポート生成機能', () => {
  // SCEN-1810
  test('指定された対象月が実行日の翌月以降の場合レポート生成するとエラーになる', () => {
    const currentDate = new Date('2026-01-15T00:00:00Z');
    const targetYear = 2026;
    const targetMonth = 2;
    const requestedByUserId = 'admin-user-001';
    const teamIdFilter = undefined;

    const input = {
      targetYear,
      targetMonth,
      requestedByUserId,
      teamIdFilter,
      currentDate,
    };

    expect(() => extractMonthlyReportData(input)).toThrow(/対象月は実行日以前の日付を指定してください/);
  });
});