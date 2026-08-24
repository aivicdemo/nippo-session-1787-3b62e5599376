import { sendDailyReportReminder } from "../../src/logic/submission-status-tracking";
import type {
  SendDailyReportReminderInput,
  SendDailyReportReminderOutput,
  ReminderNotificationDetail,
} from "../../src/logic/submission-status-tracking";

describe("sendDailyReportReminder", () => {
  // SCEN-1110: [edge] 報告期限表示機能 - 報告期限までの残り時間の計算で端数が発生し、小数以下が切り捨てられる
  test("should truncate fractional minutes when calculating remaining time until deadline", async () => {
    // Arrange: システム日時を2024年1月15日09時00分00秒に固定
    const systemTime = new Date("2024-01-15T09:00:00Z");
    const reportDeadlineTime = new Date("2024-01-15T09:30:00Z");
    const scheduledTime = new Date("2024-01-15T09:00:00Z");

    // 期限までの実質的な残り時間: 30分 (1800秒)
    const expectedRemainingTimeMinutes = 30;

    // NotificationServiceAdapterをモック化
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: "sent" as const,
        sentAt: systemTime,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(true),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        deliveredCount: 10,
        failedCount: 0,
        pendingCount: 0,
      }),
    };

    // 入力データ構築
    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ["team-001"],
      reportDeadlineTime,
      notificationChannels: ["email", "in_app", "slack"],
    };

    // Act: リマインド通知送信を実行
    const output = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter
    );

    // Assert: 出力結果の型チェック
    expect(output).toBeDefined();
    expect(typeof output.remainingTimeMinutes).toBe("number");

    // 残り時間が30分（小数点以下切り捨て）であることを確認
    expect(output.remainingTimeMinutes).toBe(expectedRemainingTimeMinutes);

    // 小数点以下が存在しないことを確認（整数値であることをチェック）
    expect(Number.isInteger(output.remainingTimeMinutes)).toBe(true);

    // 出力の構造を確認
    expect(output.sentCount).toBeGreaterThanOrEqual(0);
    expect(output.failedCount).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(output.notificationDetails)).toBe(true);

    // 通知詳細情報の構造を確認
    if (output.notificationDetails.length > 0) {
      const detail: ReminderNotificationDetail = output.notificationDetails[0];
      expect(detail.userId).toBeDefined();
      expect(["sent", "failed", "skipped"]).toContain(detail.status);
    }
  });
});