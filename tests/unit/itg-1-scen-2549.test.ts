import { sendDailyReportReminder } from "../../src/logic/submission-status-tracking";
import type {
  SendDailyReportReminderInput,
  SendDailyReportReminderOutput,
  ReminderNotificationDetail,
} from "../../src/logic/submission-status-tracking";

describe("毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信", () => {
  // SCEN-2549: [normal] リマインド通知自動送信機能 - NotificationServiceAdapterが正常応答した場合、通知送信ステータスが成功として記録される
  test("NotificationServiceAdapterが成功ステータスを返すとき、通知配信ログに成功として記録される", async () => {
    const scheduledTime = new Date("2024-11-15T08:30:00Z");
    const reportDeadlineTime = new Date("2024-11-15T09:00:00Z");
    const teamIds = ["team-001", "team-002"];
    const notificationChannels: ("email" | "in_app" | "slack")[] = [
      "email",
      "slack",
    ];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest
        .fn()
        .mockResolvedValue({
          status: "sent" as const,
          deliveryId: "delivery-001",
          sentAt: new Date("2024-11-15T08:30:05Z"),
        }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter
    );

    expect(result.sentCount).toBeGreaterThanOrEqual(1);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(30);
    expect(result.notificationDetails).toBeDefined();
    expect(Array.isArray(result.notificationDetails)).toBe(true);

    const successNotifications = result.notificationDetails.filter(
      (detail: ReminderNotificationDetail) => detail.status === "sent"
    );
    expect(successNotifications.length).toBeGreaterThanOrEqual(1);

    const firstSuccessNotification = successNotifications[0];
    expect(firstSuccessNotification).toHaveProperty("userId");
    expect(firstSuccessNotification).toHaveProperty("status", "sent");
    expect(firstSuccessNotification).toHaveProperty("sentAt");
    expect(firstSuccessNotification.sentAt).toBeDefined();
    expect(firstSuccessNotification.errorMessage).toBeUndefined();

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();
  });
});