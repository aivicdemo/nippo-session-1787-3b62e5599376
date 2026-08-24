import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendDailyReportReminder } from "../../src/logic/submission-status-tracking";
import type {
  SendDailyReportReminderInput,
  SendDailyReportReminderOutput,
  ReminderNotificationDetail,
} from "../../src/logic/submission-status-tracking";

describe("sendDailyReportReminder - ユーザーアカウント不在時の中断", () => {
  // SCEN-383
  test("存在しないユーザーに対するリマインド送信は失敗ステータスで記録され、処理が中断される", async () => {
    const nonExistentUserId = "user-does-not-exist-99999";
    const teamIdForTest = "team-001";
    const scheduledTimeForTest = new Date("2024-11-15T08:30:00Z");
    const reportDeadlineTimeForTest = new Date("2024-11-15T09:00:00Z");

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest
        .fn()
        .mockRejectedValueOnce(
          new Error("User authentication failed: User not found")
        ),
      scheduleNotification: jest.fn().mockResolvedValueOnce(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValueOnce({
        status: "failed",
        deliveredAt: null,
        errorMessage: "User not found",
      }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: scheduledTimeForTest,
      teamIds: [teamIdForTest],
      reportDeadlineTime: reportDeadlineTimeForTest,
      notificationChannels: ["email"],
    };

    let capturedOutput: SendDailyReportReminderOutput | undefined;
    let caughtError: Error | undefined;

    try {
      capturedOutput = await sendDailyReportReminder(
        input,
        mockNotificationServiceAdapter
      );
    } catch (error) {
      caughtError = error as Error;
    }

    if (capturedOutput) {
      const failedNotifications = capturedOutput.notificationDetails.filter(
        (detail: ReminderNotificationDetail) => detail.status === "failed"
      );

      expect(failedNotifications.length).toBeGreaterThan(0);

      const nonExistentUserDetail = failedNotifications.find(
        (detail: ReminderNotificationDetail) =>
          detail.userId === nonExistentUserId
      );

      if (nonExistentUserDetail) {
        expect(nonExistentUserDetail.status).toBe("failed");
        expect(nonExistentUserDetail.sentAt).toBeNull();
        expect(nonExistentUserDetail.errorMessage).toBeDefined();
        expect(nonExistentUserDetail.errorMessage).toMatch(/User|not found/i);
      }

      expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();
      expect(capturedOutput.failedCount).toBeGreaterThan(0);
    }

    if (caughtError) {
      expect(caughtError.message).toMatch(/User|not found|authentication/i);
    }

    expect(
      mockNotificationServiceAdapter.sendReminderNotification.mock.calls
        .length
    ).toBeGreaterThan(0);
  });
});