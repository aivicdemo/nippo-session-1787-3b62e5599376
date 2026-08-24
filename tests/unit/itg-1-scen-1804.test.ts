import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次レポート生成', () => {
  // SCEN-1804
  test('チーム別パフォーマンス指標データが空の状態でレポート生成するとエラーになる', () => {
    const targetYear = 2024;
    const targetMonth = 3;
    const requestedByUserId = 'user-dept-head-001';
    const teamIdFilter = undefined;

    const mockEmptyPerformanceData: never[] = [];

    const mockInput = {
      targetYear,
      targetMonth,
      requestedByUserId,
      teamIdFilter,
      performanceMetrics: mockEmptyPerformanceData,
    };

    expect(() => {
      extractMonthlyReportData(mockInput);
    }).toThrow(/チーム別パフォーマンス指標データが見つかりません/);
  });
});