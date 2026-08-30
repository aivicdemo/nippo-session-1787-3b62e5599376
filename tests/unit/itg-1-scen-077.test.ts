import { sendUnsubmittedMemberReminders } from "../../src/logic/reminder-notification-service";

describe("sendUnsubmittedMemberReminders", () => {
  test("SCEN-077: 報告期限前に未提出メンバーを検出して段階的な催促通知を送信し、再催促ルールに基づいて通知方法を変更する", () => {
    // Arrange
    const teamId = "team-001";
    const baseDate = new Date("2024-01-15T08:00:00Z");
    const reportingDeadlineTime = new Date("2024-01-15T09:00:00Z");
    const morningMeetingStartTime = new Date("2024-01-15T09:30:00Z");

    const unsubmittedMembers = [
      {
        memberId: "user-001",
        memberName: "田中太郎",
        memberEmail: "tanaka.taro@example.com",
      },
      {
        memberId: "user-002",
        memberName: "鈴木花子",
        memberEmail: "suzuki.hanako@example.com",
      },
      {
        memberId: "user-003",
        memberName: "佐藤次郎",
        memberEmail: "sato.jiro@example.com",
      },
    ];

    const reminderRetryRule = {
      initialNotificationMethod: "email" as const,
      maxRetryCount: 2,
      retryStages: [
        {
          stageNumber: 1,
          notificationMethod: "push" as const,
          waitingTimeMinutes: 15,
        },
        {
          stageNumber: 2,
          notificationMethod: "both" as const,
          waitingTimeMinutes: 30,
        },
      ],
    };

    const previousReminderHistory: any[] = [];

    // 期限までの残り時間を計算: 09:00 - 08:00 = 60分
    const minutesRemaining = 60;
    const expectedRemainingTimeDisplay = "残り60分";

    // Act
    const result = sendUnsubmittedMemberReminders({
      teamId,
      unsubmittedMembers,
      reportingDeadlineTime,
      morningMeetingStartTime,
      reminderRetryRule,
      previousReminderHistory,
      currentDateTime: baseDate,
    });

    // Assert
    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(0);
    expect(result.notificationHistoryIds).toHaveLength(3);
    expect(result.notificationHistoryIds).toEqual([
      expect.any(String),
      expect.any(String),
      expect.any(String),
    ]);
    expect(result.remainingTimeDisplay).toBe(expectedRemainingTimeDisplay);
  });
});