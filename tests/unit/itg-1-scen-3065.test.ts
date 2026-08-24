import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { generateAndSendSummaryEmail } from "../../src/logic/notification-delivery";
import type {
  GenerateAndSendSummaryEmailInput,
  GenerateAndSendSummaryEmailOutput,
} from "../../src/logic/notification-delivery";

describe("Notification Delivery - Slack/Teams API Failure Handling", () => {
  // SCEN-3065
  test("should queue failed notification to internal queue when NotificationServiceAdapter returns error response", async () => {
    // Arrange
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockRejectedValue(
        new Error("HTTP 500: Internal Server Error")
      ),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockDeliveryLogTable: Array<{
      userId: string;
      notificationType: string;
      status: string;
      timestamp: string;
      retryCount: number;
      nextRetryTime: string;
    }> = [];

    const baseTime = new Date("2024-01-15T08:00:00Z");
    const fiveMinutesLater = new Date(baseTime.getTime() + 5 * 60 * 1000);

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: "team_001",
      reportDate: "2024-01-15",
      managerUserId: "manager_001",
      submittedReports: [
        {
          reporterId: "user_001",
          reporterName: "Engineer A",
          submittedAt: "2024-01-15T08:15:00Z",
          challenges: ["Database performance issue"],
        },
      ],
      unsubmittedMemberIds: [],
      reportDeadlineTime: "09:00",
    };

    // Mock internal queue and delivery log table
    const internalQueue: Array<{
      userId: string;
      notificationType: string;
      status: string;
      timestamp: string;
      retryCount: number;
      nextRetryTime: string;
    }> = [];

    // Act
    let capturedOutput: GenerateAndSendSummaryEmailOutput | null = null;
    let caughtError: Error | null = null;

    try {
      capturedOutput = await generateAndSendSummaryEmail(input, {
        sendReminderNotification: mockNotificationServiceAdapter.sendReminderNotification,
        scheduleNotification: mockNotificationServiceAdapter.scheduleNotification,
        getDeliveryStatus: mockNotificationServiceAdapter.getDeliveryStatus,
        enqueueFailedNotification: (queueRecord) => {
          internalQueue.push(queueRecord);
          mockDeliveryLogTable.push(queueRecord);
        },
        getCurrentTime: () => baseTime,
      });
    } catch (error) {
      if (error instanceof Error) {
        caughtError = error;
      }
    }

    // Assert - Verify adapter was called
    expect(
      mockNotificationServiceAdapter.sendReminderNotification
    ).toHaveBeenCalled();

    // Assert - Verify notification was queued on failure
    expect(internalQueue.length).toBe(1);
    expect(mockDeliveryLogTable.length).toBe(1);

    const queuedRecord = internalQueue[0];
    expect(queuedRecord.userId).toBe("user_001");
    expect(queuedRecord.notificationType).toBe("reminderNotification");
    expect(queuedRecord.status).toBe("queued");
    expect(queuedRecord.retryCount).toBe(0);

    // Verify timestamp is close to base time
    const recordTimestamp = new Date(queuedRecord.timestamp);
    const timeDifference = Math.abs(
      recordTimestamp.getTime() - baseTime.getTime()
    );
    expect(timeDifference).toBeLessThan(1000); // Within 1 second

    // Verify nextRetryTime is 5 minutes after initial failure
    const nextRetryTime = new Date(queuedRecord.nextRetryTime);
    const expectedRetryTime = fiveMinutesLater;
    const retryTimeDifference = Math.abs(
      nextRetryTime.getTime() - expectedRetryTime.getTime()
    );
    expect(retryTimeDifference).toBeLessThan(1000); // Within 1 second
  });
});