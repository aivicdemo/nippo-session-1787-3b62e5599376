import { getNotificationDetail } from "../../src/logic/remind-notification-history";

describe("remind-notification-history", () => {
  // SCEN-028
  test("should throw error when notificationId format is invalid", () => {
    const invalidUserId = "user-123";

    expect(() =>
      getNotificationDetail({
        notificationId: "",
        userId: invalidUserId,
      })
    ).toThrow(/通知IDの形式が不正です/);
  });
});