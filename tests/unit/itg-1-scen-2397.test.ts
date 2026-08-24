import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次データ集約・アーカイブ移行機能', () => {
  // SCEN-2397: [error] 日報データ集約・アーカイブ移行機能 - 集約期間の開始日が指定されていないとき処理が中断される
  test('集約期間の開始日が未指定のとき、エラーメッセージ「集約期間の開始日は必須項目です」を返して処理を中断する', () => {
    const invalidInput = {
      targetYear: 2026,
      targetMonth: 12,
      requestedByUserId: 'user-dept-chief-001',
      teamIdFilter: undefined,
      aggregationStartDate: undefined,
      aggregationEndDate: new Date('2026-12-31T23:59:59Z')
    };

    expect(() => extractMonthlyReportData(invalidInput)).toThrow(/集約期間の開始日/);
  });
});