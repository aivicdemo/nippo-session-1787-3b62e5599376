import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { sendUnsubmittedMemberReminders } from "../../src/logic/reminder-notification-service";
import type {
  UnsubmittedMemberReminderInput,
  ReminderNotificationResult,
} from "../../src/logic/reminder-notification-service";

describe("sendUnsubmittedMemberReminders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-623: [normal] 報告期限前に未提出メンバーを検出して段階的な催促通知を送信し、再催促ルールに基づいて通知方法を変更する
  test("should send initial reminder notifications to unsubmitted members and record history with correct remaining time display", () => {
    const reportingDeadlineTime = new Date("2025-01-20T09:00:00Z");
    const morningMeetingStartTime = new Date("2025-01-20T09:15:00Z");
    const currentDateTime = new Date("2025-01-20T09:10:00Z");

    const input: UnsubmittedMemberReminderInput = {
      teamId: "team-001",
      unsubmittedMembers: [
        {
          userId: "member-001",
          email: "user@example.com",
          displayName: "田中太郎",
        },
        {
          userId: "member-002",
          email: "user2@example.com",
          displayName: "鈴木花子",
        },
      ],
      reportingDeadlineTime: reportingDeadlineTime,
      morningMeetingStartTime: morningMeetingStartTime,
      reminderRetryRule: {
        initialNotificationMethod: "email" as const,
        maxRetryCount: 2,
        retryStages: [
          {
            stageNumber: 1,
            notificationMethod: "slack" as const,
            waitMinutesSincePrevious: 10,
          },
          {
            stageNumber: 2,
            notificationMethod: "email" as const,
            waitMinutesSincePrevious: 10,
          },
        ],
      },
      previousReminderHistory: [],
      currentDateTime: currentDateTime,
    };

    const result: ReminderNotificationResult =
      sendUnsubmittedMemberReminders(input);

    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(0);
    expect(result.notificationHistoryIds).toHaveLength(2);
    expect(result.notificationHistoryIds[0]).toBeDefined();
    expect(result.notificationHistoryIds[1]).toBeDefined();
    expect(result.remainingTimeDisplay).toBe("残り5分");
  });
});