import { listNotificationHistory } from "../../src/logic/remind-notification-history";
import type { NotificationHistorySearchCriteria } from "../../src/logic/remind-notification-history";

describe("listNotificationHistory", () => {
  // SCEN-022
  test("should throw permission error when user lacks access to notification management screen", async () => {
    const searchCriteria: NotificationHistorySearchCriteria = {
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-01-31T23:59:59Z"),
      pageNumber: 1,
      pageSize: 10,
    };

    const userIdWithoutPermission = "user-without-permission";

    await expect(() =>
      listNotificationHistory(userIdWithoutPermission, searchCriteria)
    ).rejects.toThrow(/閲覧権限/);
  });
});