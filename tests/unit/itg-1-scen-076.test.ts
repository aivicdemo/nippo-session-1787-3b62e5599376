import { sendDailyReminderNotifications } from "../../src/logic/reminder-notification-service";
import type {
  DailyReminderInput,
  ReminderNotificationResult,
} from "../../src/logic/reminder-notification-service";

describe("朝会報告管理システム - リマインド通知サービス", () => {
  // SCEN-076
  test("報告期限の計算ロジックが不正な値を返す場合、InvalidDeadlineCalculationError エラーが発生する", () => {
    const currentTime = new Date("2024-01-01T10:00:00Z");
    const pastDeadline = new Date("2024-01-01T08:00:00Z");

    const dailyReminderInput: DailyReminderInput = {
      teamId: "team-001",
      reportDeadlineDateTime: pastDeadline,
      executionTimestamp: currentTime,
      notificationChannels: [
        {
          channelType: "email",
          isEnabled: true,
        },
      ],
    };

    expect(() => sendDailyReminderNotifications(dailyReminderInput)).toThrow(
      /報告期限の計算に失敗しました/
    );
  });
});