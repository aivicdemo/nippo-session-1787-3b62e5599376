import { sendDailyReminderNotifications } from "../../src/logic/reminder-notification-service";

describe("朝会報告管理システム - 定時リマインド送信機能", () => {
  // SCEN-289: 定時リマインド送信予定時刻が営業日でないときは、リマインド通知は送信されない
  test("executionTimestampが休業日（日曜日）の場合、notificationChannelsが指定されていても通知は送信されず、すべてのカウント関連フィールドが0または空になること", () => {
    // Arrange
    const teamId = "team-001";
    const reportDeadlineDateTime = new Date("2026-08-23T09:00:00Z"); // 日曜日 09:00
    const executionTimestamp = new Date("2026-08-23T08:30:00Z"); // 日曜日 08:30（休業日）
    const notificationChannels = [{ channelType: "email", isEnabled: true }];

    // Act
    const result = sendDailyReminderNotifications(
      teamId,
      reportDeadlineDateTime,
      executionTimestamp,
      notificationChannels
    );

    // Assert
    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(0);
    expect(result.notificationHistoryIds).toEqual([]);
    expect(result.remainingTimeDisplay).toBe("");
  });
});