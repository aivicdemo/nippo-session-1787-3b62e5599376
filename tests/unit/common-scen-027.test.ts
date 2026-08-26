import { getNotificationDetail, type NotificationDetail } from "../../src/logic/remind-notification-history";

describe("RemindNotificationHistory", () => {
  // SCEN-027
  test("should throw error when user lacks permission to view notification detail", async () => {
    const notificationId = "notif-001";
    const userId = "user-b";

    const mockInput = {
      notificationId,
      userId,
    };

    expect(() => getNotificationDetail(mockInput)).toThrow(/権限/);
  });
});