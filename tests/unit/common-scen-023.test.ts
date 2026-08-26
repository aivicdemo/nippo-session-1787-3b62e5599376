import { listNotificationHistory } from '../../src/logic/remind-notification-history';

describe('リマインド通知履歴検索', () => {
  // SCEN-023
  test('検索条件の日付範囲が不正または必須項目が不足している場合、検索条件が不正です。のエラーが返される', () => {
    const pattern1_startDate = new Date('2024-01-31');
    const pattern1_endDate = new Date('2024-01-01');
    const pattern1_pageNumber = 1;
    const pattern1_pageSize = 10;

    const result1 = listNotificationHistory({
      startDate: pattern1_startDate,
      endDate: pattern1_endDate,
      pageNumber: pattern1_pageNumber,
      pageSize: pattern1_pageSize,
    });

    expect(result1).toHaveProperty('error');
    expect(result1.error).toMatch(/検索条件が不正/);
    expect(result1).toHaveProperty('statusCode', 400);

    const pattern2_startDate = null as unknown as Date;
    const pattern2_endDate = new Date('2024-01-31');
    const pattern2_pageNumber = 1;
    const pattern2_pageSize = 10;

    const result2 = listNotificationHistory({
      startDate: pattern2_startDate,
      endDate: pattern2_endDate,
      pageNumber: pattern2_pageNumber,
      pageSize: pattern2_pageSize,
    });

    expect(result2).toHaveProperty('error');
    expect(result2.error).toMatch(/検索条件が不正/);
    expect(result2).toHaveProperty('statusCode', 400);

    const pattern3_startDate = undefined as unknown as Date;
    const pattern3_endDate = undefined as unknown as Date;
    const pattern3_pageNumber = 1;
    const pattern3_pageSize = 10;

    const result3 = listNotificationHistory({
      startDate: pattern3_startDate,
      endDate: pattern3_endDate,
      pageNumber: pattern3_pageNumber,
      pageSize: pattern3_pageSize,
    });

    expect(result3).toHaveProperty('error');
    expect(result3.error).toMatch(/検索条件が不正/);
    expect(result3).toHaveProperty('statusCode', 400);
  });
});