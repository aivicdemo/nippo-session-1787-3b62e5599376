import { sendDailyReminderNotifications } from "../../src/logic/reminder-notification-service";
import type { DailyReminderInput, ReminderNotificationResult, NotificationChannel } from "../../src/logic/reminder-notification-service";

describe("sendDailyReminderNotifications", () => {
  // SCEN-310: [normal] 毎朝定時に登録済みチームメンバー全員へ報告入力のリマインド通知を自動送信し、報告期限までの残り時間を表示する - sendDailyReminderNotificationsが設計された計算式の代表値を返す
  test("should send daily reminder notifications to all registered team members with remaining time display", () => {
    const teamId = "team-001";
    const reportDeadlineDateTime = new Date("2026-08-20T09:00:00Z");
    const executionTimestamp = new Date("2026-08-20T08:30:00Z");
    const notificationChannels: NotificationChannel[] = [
      { channelType: "email", isEnabled: true },
    ];

    const input: DailyReminderInput = {
      teamId,
      reportDeadlineDateTime,
      executionTimestamp,
      notificationChannels,
    };

    const result: ReminderNotificationResult = sendDailyReminderNotifications(input);

    const expectedSuccessCount = 3;
    const expectedFailureCount = 0;
    const expectedHistoryIds = ["history-001", "history-002", "history-003"];
    const remainingMinutes = 30;
    const expectedRemainingTimeDisplay = "残り30分";

    expect(result.successCount).toBe(expectedSuccessCount);
    expect(result.failureCount).toBe(expectedFailureCount);
    expect(result.notificationHistoryIds).toEqual(expectedHistoryIds);
    expect(result.remainingTimeDisplay).toBe(expectedRemainingTimeDisplay);
  });
});