import { sendDailyReminderNotifications } from "../../src/logic/reminder-notification-service";
import type { DailyReminderInput } from "../../src/logic/reminder-notification-service";

describe("朝会報告管理システム - リマインド通知サービス", () => {
  test("SCEN-293: チームメンバーIDが空のときに『通知対象のチームメンバーが見つかりません』エラーを発生させる", () => {
    const now = new Date("2024-01-15T09:30:00Z");
    const deadlineTime = new Date("2024-01-15T11:30:00Z");

    const input: DailyReminderInput = {
      teamId: "team-001",
      reportDeadlineDateTime: deadlineTime,
      executionTimestamp: now,
      notificationChannels: [
        {
          channelType: "email",
          isEnabled: true,
        },
      ],
    };

    expect(() => sendDailyReminderNotifications(input, [])).toThrow(
      /通知対象のチームメンバー/
    );
  });
});