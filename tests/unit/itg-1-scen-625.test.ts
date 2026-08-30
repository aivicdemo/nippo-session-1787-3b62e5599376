import { sendUnsubmittedMemberReminders } from "../../src/logic/reminder-notification-service";
import { type UnsubmittedMemberReminderInput } from "../../src/logic/reminder-notification-service";

describe("朝会報告管理システム - 未提出メンバー催促通知", () => {
  // SCEN-625: [error] 報告期限時刻が未設定のときはDeadlineCalculationErrorをスロー
  test("reportingDeadlineTimeがnullのとき、DeadlineCalculationErrorをスロー", () => {
    const input: UnsubmittedMemberReminderInput = {
      teamId: "team-001",
      unsubmittedMembers: [
        {
          memberId: "user-001",
          memberEmail: "member@example.com",
          memberName: "田中太郎",
        },
      ],
      reportingDeadlineTime: null as any,
      morningMeetingStartTime: new Date(
        new Date().getTime() + 3600000
      ).toISOString(),
      reminderRetryRule: {
        initialNotificationMethod: "email",
        maxRetryCount: 2,
        retryStages: [
          { stageNumber: 1, notificationMethod: "email", waitMinutes: 10 },
          { stageNumber: 2, notificationMethod: "push", waitMinutes: 10 },
        ],
      },
      previousReminderHistory: [],
    };

    expect(() => sendUnsubmittedMemberReminders(input)).toThrow(/期限/);
  });
});