import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次日報データ集約機能', () => {
  // SCEN-2401: [error] 日報データ集約・アーカイブ移行機能 - 集約期間が指定されず空の状態で処理開始指示されたとき処理が中断される
  test('should reject extraction when aggregation period is not specified', () => {
    const invalidInput = {
      targetYear: undefined,
      targetMonth: undefined,
      requestedByUserId: 'user-001',
      teamIdFilter: undefined,
    };

    expect(() => {
      extractMonthlyReportData(
        invalidInput.targetYear as any,
        invalidInput.targetMonth as any,
        invalidInput.requestedByUserId,
        invalidInput.teamIdFilter,
      );
    }).toThrow(/集約期間/);
  });
});