import { getNotificationDetail, type GetNotificationDetailInput } from "../../src/logic/remind-notification-history";

describe("getNotificationDetail", () => {
  // SCEN-028
  test("should throw error when notificationId format is invalid", async () => {
    const invalidInput: GetNotificationDetailInput = {
      notificationId: "invalid-format-not-uuid",
      userId: "user-123",
    };

    await expect(() =>
      getNotificationDetail(invalidInput)
    ).rejects.toThrow(/通知IDの形式が不正です/);
  });
});