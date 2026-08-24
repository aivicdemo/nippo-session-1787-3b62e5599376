import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { sendDailyReportReminder } from "../../src/logic/submission-status-tracking";
import type {
  SendDailyReportReminderInput,
  SendDailyReportReminderOutput,
  ReminderNotificationDetail,
} from "../../src/logic/submission-status-tracking";

describe("sendDailyReportReminder", () => {
  // SCEN-2566
  test("should not send reminder notifications before scheduled time (8:59:59) and should send at exact scheduled time (9:00:00)", async () => {
    // Arrange
    const mockNotificationSendCalls: Array<{
      timestamp: Date;
      userId: string;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(
        async (userId: string, message: string) => {
          mockNotificationSendCalls.push({
            timestamp: new Date(),
            userId,
          });
          return {
            userId,
            status: "sent" as const,
            sentAt: new Date(),
            errorMessage: null,
          };
        }
      ),
      scheduleNotification: jest.fn(async () => {
        return { success: true };
      }),
      getDeliveryStatus: jest.fn(async () => {
        return { deliveredCount: 0, failedCount: 0 };
      }),
    };

    const scheduledTime_859959 = new Date("2024-01-15T08:59:59Z");
    const scheduledTime_900000 = new Date("2024-01-15T09:00:00Z");
    const reportDeadlineTime = new Date("2024-01-15T09:30:00Z");

    const inputAt859959: SendDailyReportReminderInput = {
      scheduledTime: scheduledTime_859959,
      teamIds: ["team-001", "team-002"],
      reportDeadlineTime: reportDeadlineTime,
      notificationChannels: ["email", "in_app", "slack"],
    };

    // Act: Call at 8:59:59
    const resultAt859959: SendDailyReportReminderOutput = await sendDailyReportReminder(
      inputAt859959,
      mockNotificationServiceAdapter
    );

    const callCountAt859959 = mockNotificationSendCalls.length;

    // Assert at 8:59:59: no notifications should be sent
    expect(callCountAt859959).toBe(0);
    expect(resultAt859959.sentCount).toBe(0);
    expect(resultAt859959.failedCount).toBe(0);

    // Act: Call at 9:00:00
    const inputAt900000: SendDailyReportReminderInput = {
      scheduledTime: scheduledTime_900000,
      teamIds: ["team-001", "team-002"],
      reportDeadlineTime: reportDeadlineTime,
      notificationChannels: ["email", "in_app", "slack"],
    };

    const resultAt900000: SendDailyReportReminderOutput = await sendDailyReportReminder(
      inputAt900000,
      mockNotificationServiceAdapter
    );

    const callCountAt900000 = mockNotificationSendCalls.length;

    // Assert at 9:00:00: notifications should be sent
    expect(callCountAt900000).toBeGreaterThan(0);
    expect(resultAt900000.sentCount).toBeGreaterThan(0);

    // Verify that all sent notifications have timestamps at or after 9:00:00
    const allSentNotificationsAfterScheduledTime = mockNotificationSendCalls.every(
      (call) => call.timestamp >= scheduledTime_900000
    );
    expect(allSentNotificationsAfterScheduledTime).toBe(true);

    // Verify that no notifications were sent before 9:00:00
    const noNotificationsBeforeScheduledTime = mockNotificationSendCalls.every(
      (call) => call.timestamp < scheduledTime_859959 || call.timestamp >= scheduledTime_900000
    );
    expect(noNotificationsBeforeScheduledTime).toBe(true);

    // Verify remaining time calculation
    const expectedRemainingMinutes = Math.floor(
      (reportDeadlineTime.getTime() - scheduledTime_900000.getTime()) / 60000
    );
    expect(resultAt900000.remainingTimeMinutes).toBe(expectedRemainingMinutes);

    // Verify notification details structure
    expect(Array.isArray(resultAt900000.notificationDetails)).toBe(true);
    resultAt900000.notificationDetails.forEach(
      (detail: ReminderNotificationDetail) => {
        expect(typeof detail.userId).toBe("string");
        expect(["sent", "failed", "skipped"]).toContain(detail.status);
      }
    );
  });
});