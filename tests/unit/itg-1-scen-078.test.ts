import { sendUnsubmittedMemberReminders } from "../../src/logic/reminder-notification-service";

describe("朝会報告管理システム - 未提出メンバー催促通知", () => {
  // SCEN-078
  test("再催促ルール設定が無効な場合、InvalidReminderConfigurationErrorが発生する", () => {
    const teamId = "team-001";
    const now = new Date("2024-01-15T07:00:00Z");
    const reportingDeadlineTime = new Date("2024-01-15T09:00:00Z");
    const morningMeetingStartTime = new Date("2024-01-15T08:00:00Z");

    const unsubmittedMembers = [
      {
        memberId: "user-001",
        memberName: "田中太郎",
        memberEmail: "tanaka@example.com",
      },
      {
        memberId: "user-002",
        memberName: "山田花子",
        memberEmail: "yamada@example.com",
      },
    ];

    const invalidReminderRetryRule = {
      initialNotificationMethod: "email" as const,
      maxRetryCount: -1,
      retryStages: [
        {
          stageNumber: 1,
          notificationMethod: "email",
          waitingTimeMinutes: 30,
        },
      ],
    };

    const previousReminderHistory: any[] = [];

    const input = {
      teamId,
      unsubmittedMembers,
      reportingDeadlineTime,
      morningMeetingStartTime,
      reminderRetryRule: invalidReminderRetryRule,
      previousReminderHistory,
      currentDateTime: now,
    };

    expect(() => sendUnsubmittedMemberReminders(input)).toThrow(
      /再催促ルール設定が無効です/
    );
  });
});