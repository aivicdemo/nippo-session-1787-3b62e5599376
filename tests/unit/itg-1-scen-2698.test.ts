import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('fetchYesterdayReport', () => {
  test('SCEN-2698: reportDateが未来日のとき、INVALID_REPORT_DATE_FUTUREエラーがスローされる', () => {
    const engineerId = 'engineer-001';
    const targetDate = new Date('2026-08-21'); // 未来日
    const requestingUserId = 'manager-001';

    // 現在日時を2026-08-20に固定してテスト実行
    const mockCurrentDate = new Date('2026-08-20T09:00:00Z');
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => mockCurrentDate.getTime());

    try {
      expect(() =>
        fetchYesterdayReport({
          engineerId,
          targetDate,
          requestingUserId,
        })
      ).toThrow(/INVALID_REPORT_DATE_FUTURE/);
    } finally {
      Date.now = originalDateNow;
    }
  });
});