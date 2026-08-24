import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - extractMonthlyReportData', () => {
  // SCEN-1796: [error] 月次レポート生成機能 - 前月分の日報データが完全に蓄積されていない状態でレポート生成を実行するとエラーになる
  test('should throw error when report data is incomplete - missing submission from 1 member out of 10', () => {
    // 準備: テスト対象月の前月（1月分）について、チームメンバー10名中9名の日報データのみを準備
    const targetYear = 2024;
    const targetMonth = 2; // 2月 = 前月が1月
    const requestedByUserId = 'manager-001';
    const teamIdFilter = undefined; // 全チーム対象

    // 10名中9名の日報レコードのみを生成
    const incompleteReportData = Array.from({ length: 9 }, (_, i) => ({
      reportId: `report-${i + 1}`,
      userId: `engineer-${String(i + 1).padStart(2, '0')}`,
      reportDate: new Date('2024-01-15'),
      content: `Day ${i + 1} report content`,
      submittedAt: new Date('2024-01-15T09:00:00Z'),
    }));

    // 実行: 不完全なデータでレポート生成を試みる
    const createMonthlyReportInput: typeof extractMonthlyReportData extends (
      arg: infer T,
    ) => any
      ? T
      : never = {
      targetYear,
      targetMonth,
      requestedByUserId,
      teamIdFilter,
      reportRecords: incompleteReportData,
      totalExpectedSubmitters: 10,
    };

    // 検証: 不完全なデータ（9名中10名）でエラーが発生することを確認
    expect(() =>
      extractMonthlyReportData(createMonthlyReportInput),
    ).toThrow(/未提出者|不完全|前月分/);
  });
});