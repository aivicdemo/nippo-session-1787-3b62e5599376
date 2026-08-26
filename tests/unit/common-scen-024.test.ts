import { listNotificationHistory } from "../../src/logic/remind-notification-history";

describe("listNotificationHistory", () => {
  // SCEN-024
  test("should return error object with message when notification history database access fails", async () => {
    const searchCriteria = {
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-01-31T23:59:59Z"),
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listNotificationHistory(searchCriteria);

    expect(result).toHaveProperty("error");
    expect(result.error).toMatch(/通知履歴の取得に失敗しました。/);
    expect(result.records).toBeUndefined();
    expect(result.totalCount).toBeUndefined();
    expect(result.pageNumber).toBeUndefined();
    expect(result.pageSize).toBeUndefined();
  });
});