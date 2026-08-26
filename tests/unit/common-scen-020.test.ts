import { sendRemindNotifications } from "../../src/logic/remind-notification-sender";

describe("sendRemindNotifications", () => {
  // SCEN-020
  test("should throw permission error when caller lacks notification send authority", () => {
    const input = {
      scheduleId: "schedule-001",
      userId: "user-general-member",
      executionTimestamp: 1705318800000,
    };

    expect(() => sendRemindNotifications(input)).toThrow(
      /権限/
    );
  });
});