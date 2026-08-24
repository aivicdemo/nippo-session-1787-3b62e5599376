import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次日報データ集約機能', () => {
  // SCEN-2404: [error] 日報データ集約・アーカイブ移行機能 - 指定された開始日が将来日付のとき処理が中断される
  test('開始日付が将来日付の場合、ValidationErrorが発生し処理が中断される', () => {
    const today = new Date('2024-01-15T00:00:00Z');
    const futureStartDate = new Date('2025-12-31T00:00:00Z');
    const endDate = today;

    expect(() => {
      extractMonthlyReportData({
        aggregationStartDate: futureStartDate,
        aggregationEndDate: endDate,
        teamIds: [],
        reportRecords: [],
      });
    }).toThrow(/開始日付/);
  });
});