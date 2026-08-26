import { listNotificationHistory, type NotificationHistorySearchCriteria } from "../../src/logic/remind-notification-history";

describe("リマインド通知履歴の検索", () => {
  // SCEN-022
  test("権限なしユーザーがリマインド通知履歴を検索すると403エラーが返される", async () => {
    const searchCriteria: NotificationHistorySearchCriteria = {
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-01-31T23:59:59Z"),
      pageNumber: 1,
      pageSize: 10,
    };

    const userIdWithoutPermission = "user-without-permission";

    await expect(
      listNotificationHistory(searchCriteria, userIdWithoutPermission)
    ).rejects.toThrow(/閲覧権限/);
  });
});