import { sendUnsubmittedMemberReminders } from "../../src/logic/reminder-notification-service";
import type { UnsubmittedMemberReminderInput, ReminderRetryRule, UnsubmittedMember } from "../../src/logic/reminder-notification-service";

describe("朝会報告管理システム - 未提出メンバーリマインド通知", () => {
  // SCEN-630
  test("報告受付終了後に新規催促通知を送信しようとしたとき、DeadlineCalculationError が発生し適切なエラーメッセージを返す", () => {
    const now = new Date("2024-01-15T09:30:00Z");
    const morningMeetingStartTime = new Date("2024-01-15T09:00:00Z");
    const reportingDeadlineTime = new Date("2024-01-15T08:30:00Z");

    const unsubmittedMembers: UnsubmittedMember[] = [
      {
        memberId: "user-001",
        memberName: "田中太郎",
        memberEmail: "tanaka@example.com",
      },
    ];

    const reminderRetryRule: ReminderRetryRule = {
      initialNotificationMethod: "email",
      maxRetryCount: 2,
      retryStages: [
        {
          stageNumber: 1,
          notificationMethod: "email",
          waitingTimeMinutes: 30,
        },
        {
          stageNumber: 2,
          notificationMethod: "both",
          waitingTimeMinutes: 60,
        },
      ],
    };

    const input: UnsubmittedMemberReminderInput = {
      teamId: "team-001",
      unsubmittedMembers: unsubmittedMembers,
      reportingDeadlineTime: reportingDeadlineTime,
      morningMeetingStartTime: morningMeetingStartTime,
      reminderRetryRule: reminderRetryRule,
      previousReminderHistory: [],
    };

    expect(() => {
      sendUnsubmittedMemberReminders(input, { getCurrentTime: () => now });
    }).toThrow(/報告受付は終了/);
  });
});