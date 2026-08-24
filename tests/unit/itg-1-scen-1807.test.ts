import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能 - プロジェクトマネージャー連絡先が null の状態でレポート生成するとエラーになる', () => {
  // SCEN-1807
  test('プロジェクトマネージャー連絡先が null の場合、エラーが発生する', () => {
    const monthlyReportParams = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'user-001',
      teamIdFilter: undefined,
      projectManagerContact: null as any,
      reportGenerationStartDate: new Date('2024-01-01T00:00:00Z'),
      reportGenerationEndDate: new Date('2024-01-31T23:59:59Z'),
    };

    expect(() => {
      extractMonthlyReportData(monthlyReportParams);
    }).toThrow(/プロジェクトマネージャー連絡先|連絡先が未設定|INVALID_PROJECT_MANAGER_CONTACT/);
  });
});