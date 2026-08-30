import { retrieveReportsByDateRange } from '../../src/logic/report-persistence';

describe('Report Persistence - Date Range Query', () => {
  // SCEN-151: [error] 指定された日付範囲内の日報データを検索・抽出し、構造化データとして返却する。 - 開始日付が終了日付より後である、または日付形式が不正である場合。
  test('should throw InvalidDateRangeError when startDate is after endDate', () => {
    const invalidQuery = {
      startDate: '2024-01-15',
      endDate: '2024-01-10',
    };

    expect(() => retrieveReportsByDateRange(invalidQuery)).toThrow(/指定された日付範囲が無効です。開始日付は終了日付以前である必要があります。/);
  });
});