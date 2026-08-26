import { sendRemindNotifications, type SendRemindNotificationsInput, type SendRemindNotificationsOutput } from "../../src/logic/remind-notification-sender";

const fetchMock = require("jest-fetch-mock");

describe("sendRemindNotifications", () => {
  // SCEN-017
  test("should send remind notifications to all team members and record results", async () => {
    fetchMock.resetMocks();

    const scheduleId = "schedule-001";
    const userId = "user-001";
    const executionTimestamp = 1705318800000; // 2024-01-15T09:00:00Z

    const input: SendRemindNotificationsInput = {
      scheduleId,
      userId,
      executionTimestamp,
    };

    const memberCount = 10;
    const mockEmailIds = Array.from({ length: memberCount }, (_, i) => `email-id-${i + 1}`);

    // Mock メール配信API レスポンス (10名分)
    for (let i = 0; i < memberCount; i++) {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          success: true,
          emailId: mockEmailIds[i],
          sentAt: executionTimestamp,
        }),
        { status: 200 }
      );
    }

    const result: SendRemindNotificationsOutput = await sendRemindNotifications(input);

    expect(result.scheduleId).toBe(scheduleId);
    expect(result.totalCount).toBe(memberCount);
    expect(result.successCount).toBe(memberCount);
    expect(result.failureCount).toBe(0);
  });
});