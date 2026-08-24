import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能', () => {
  // SCEN-1805
  test('対象年月が null の状態でレポート生成するとエラーになる', () => {
    const input = {
      targetYear: null,
      targetMonth: null,
      requestedByUserId: 'user-001',
      teamIdFilter: undefined,
    };

    expect(() => extractMonthlyReportData(input as any)).toThrow(/対象年月/);
  });
});