import { sendRemindNotifications, type SendRemindNotificationsInput, type SendRemindNotificationsOutput } from "../../src/logic/remind-notification-sender";

describe("sendRemindNotifications", () => {
  // SCEN-020
  test("should throw error when user lacks notification sending permission", () => {
    const input: SendRemindNotificationsInput = {
      scheduleId: "schedule-001",
      userId: "user-unprivileged",
      executionTimestamp: 1705315200000,
    };

    expect(() => sendRemindNotifications(input)).toThrow(/権限/);
  });
});