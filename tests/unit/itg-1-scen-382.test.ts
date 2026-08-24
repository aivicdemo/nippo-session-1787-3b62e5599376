import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { sendDailyReportReminder } from "../../src/logic/submission-status-tracking";
import type {
  SendDailyReportReminderInput,
  SendDailyReportReminderOutput,
  ReminderNotificationDetail,
} from "../../src/logic/submission-status-tracking";

describe("sendDailyReportReminder - NotificationServiceAdapter timeout handling", () => {
  // SCEN-382
  test("should handle scheduleNotification timeout and record failure with retry queue", async () => {
    const scheduledTime = new Date("2024-01-15T08:30:00Z");
    const reportDeadlineTime = new Date("2024-01-15T09:00:00Z");
    const teamIds = ["team-001", "team-002"];
    const notificationChannels = ["email", "slack"] as const;

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest
        .fn()
        .mockResolvedValue({ status: "sent" as const, sentAt: new Date() }),
      scheduleNotification: jest.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                scheduledIds: ["scheduled-001"],
                status: "scheduled" as const,
              });
            }, 35000);
          })
      ),
      getDeliveryStatus: jest
        .fn()
        .mockResolvedValue({ status: "pending" as const, count: 0 }),
    };

    const mockDashboardNotificationService = {
      displayDelayWarning: jest.fn().mockResolvedValue(undefined),
    };

    const mockRetryQueueService = {
      enqueue: jest.fn().mockResolvedValue({ queueId: "queue-001" }),
      getQueueStatus: jest
        .fn()
        .mockResolvedValue({ itemCount: 1, nextRetryAt: new Date() }),
    };

    const mockDeliveryLogRepository = {
      recordFailure: jest
        .fn()
        .mockResolvedValue({ logId: "log-001", status: "failed" as const }),
      getLatestByNotificationId: jest.fn().mockResolvedValue({
        notificationId: "notif-001",
        status: "failed" as const,
        failureReason: "Timeout after 30 seconds",
        recordedAt: new Date("2024-01-15T08:30:35Z"),
      }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    let result: SendDailyReportReminderOutput | undefined;
    let capturedError: Error | undefined;

    try {
      const timeoutPromise = new Promise<SendDailyReportReminderOutput>(
        (_, reject) => {
          setTimeout(() => {
            reject(new Error("Timeout after 30 seconds"));
          }, 30000);
        }
      );

      const executionPromise = sendDailyReportReminder(
        input,
        mockNotificationServiceAdapter,
        mockDashboardNotificationService,
        mockRetryQueueService,
        mockDeliveryLogRepository
      );

      result = await Promise.race([executionPromise, timeoutPromise]);
    } catch (error) {
      if (error instanceof Error) {
        capturedError = error;
      }
    }

    expect(capturedError).toBeDefined();
    expect(capturedError?.message).toMatch(/タイムアウト|Timeout/);

    expect(
      mockNotificationServiceAdapter.scheduleNotification
    ).toHaveBeenCalledWith(expect.objectContaining({}));

    expect(mockDeliveryLogRepository.recordFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        failureReason: expect.stringMatching(/タイムアウト|Timeout/),
      })
    );

    expect(mockDashboardNotificationService.displayDelayWarning).toHaveBeenCalled();

    expect(mockRetryQueueService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        failedNotificationId: expect.any(String),
        retryStrategy: expect.objectContaining({
          maxRetries: 3,
          intervals: expect.arrayContaining([
            300000, // 5分
            900000, // 15分
            3600000, // 1時間
          ]),
        }),
      })
    );

    const queueStatus = await mockRetryQueueService.getQueueStatus();
    expect(queueStatus.itemCount).toBe(1);
    expect(queueStatus.nextRetryAt).toBeDefined();
  });
});