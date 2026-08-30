import { sendDailyReminderNotifications } from "../../src/logic/reminder-notification-service";

describe("朝会報告管理システム - リマインド通知送信", () => {
  // SCEN-294
  test("報告期限が現在時刻以前の場合、InvalidDeadlineCalculationErrorが発生する", async () => {
    const executionTimestamp = new Date("2026-08-20T08:30:00Z");
    const reportDeadlineDateTime = new Date(
      executionTimestamp.getTime() - 0
    );

    const dailyReminderInput = {
      teamId: "team-001",
      reportDeadlineDateTime: reportDeadlineDateTime,
      executionTimestamp: executionTimestamp,
      notificationChannels: [
        {
          channelType: "email",
          isEnabled: true,
        },
      ],
    };

    await expect(
      sendDailyReminderNotifications(dailyReminderInput)
    ).rejects.toThrow(/報告期限の計算に失敗しました/);
  });
});