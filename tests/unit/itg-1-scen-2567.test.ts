import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { sendDailyReportReminder } from "../../src/logic/submission-status-tracking";

describe("毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能", () => {
  // SCEN-2567
  test("定時刻の1秒後（9時00分01秒）にリマインド通知が送信される", async () => {
    // Arrange
    const scheduledTime = new Date("2024-01-15T09:00:00Z");
    const reportDeadlineTime = new Date("2024-01-15T09:30:00Z");
    const teamIds = ["team-001"];
    const notificationChannels: ("email" | "in_app" | "slack")[] = ["email"];

    const mockNotificationLogs: Array<{
      timestamp: Date;
      status: "sent" | "failed" | "skipped";
      userId: string;
      sentAt: Date | null;
    }> = [];

    const mockSendReminderNotification = jest.fn(
      async (
        userId: string,
        _message: string,
        _channels: ("email" | "in_app" | "slack")[]
      ) => {
        mockNotificationLogs.push({
          timestamp: new Date("2024-01-15T09:00:01Z"),
          status: "sent",
          userId: userId,
          sentAt: new Date("2024-01-15T09:00:01Z"),
        });
        return { success: true, sentAt: new Date("2024-01-15T09:00:01Z") };
      }
    );

    const mockGetTeamMembers = jest.fn(async (teamId: string) => {
      const teamMembers = Array.from({ length: 10 }, (_, i) => ({
        userId: `user-${String(i + 1).padStart(3, "0")}`,
        userName: `Member ${i + 1}`,
        email: `member${i + 1}@example.com`,
      }));
      return teamMembers;
    });

    const mockNotificationServiceAdapter = {
      sendReminderNotification: mockSendReminderNotification,
      getTeamMembers: mockGetTeamMembers,
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // Act
    const result = await sendDailyReportReminder(
      {
        scheduledTime: scheduledTime,
        teamIds: teamIds,
        reportDeadlineTime: reportDeadlineTime,
        notificationChannels: notificationChannels,
      },
      mockNotificationServiceAdapter
    );

    // Assert
    expect(mockSendReminderNotification).toHaveBeenCalledTimes(10);

    const callArgs = mockSendReminderNotification.mock.calls;
    const calledUserIds = callArgs.map((call) => call[0]);
    expect(calledUserIds).toEqual(
      expect.arrayContaining([
        "user-001",
        "user-002",
        "user-003",
        "user-004",
        "user-005",
        "user-006",
        "user-007",
        "user-008",
        "user-009",
        "user-010",
      ])
    );

    expect(mockNotificationLogs).toHaveLength(10);
    mockNotificationLogs.forEach((log) => {
      expect(log.timestamp).toEqual(new Date("2024-01-15T09:00:01Z"));
      expect(log.status).toBe("sent");
      expect(log.sentAt).toEqual(new Date("2024-01-15T09:00:01Z"));
    });

    expect(result.sentCount).toBe(10);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(30);
    expect(result.notificationDetails).toHaveLength(10);
    result.notificationDetails.forEach((detail) => {
      expect(detail.status).toBe("sent");
      expect(detail.sentAt).toEqual(new Date("2024-01-15T09:00:01Z"));
      expect(detail.errorMessage).toBeUndefined();
    });
  });
});