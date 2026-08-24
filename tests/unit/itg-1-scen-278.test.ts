import { sendDailyReportReminder } from "../../src/logic/submission-status-tracking";
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from "../../src/logic/submission-status-tracking";

describe("朝会報告リマインド通知送信機能", () => {
  // SCEN-278
  test("NotificationServiceAdapterのsendReminderNotificationが正常応答した場合、通知配信ログが記録される", async () => {
    const now = new Date("2024-01-15T08:30:00Z");
    const deadlineTime = new Date("2024-01-15T09:00:00Z");
    const scheduledTime = new Date("2024-01-15T08:30:00Z");

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ["team-001", "team-002"],
      reportDeadlineTime: deadlineTime,
      notificationChannels: ["email", "slack"],
    };

    const notificationServiceStub = {
      sendReminderNotification: jest
        .fn()
        .mockResolvedValue({
          userId: "user-001",
          status: "sent",
          sentAt: now,
          errorMessage: null,
        })
        .mockResolvedValueOnce({
          userId: "user-001",
          status: "sent",
          sentAt: now,
          errorMessage: null,
        })
        .mockResolvedValueOnce({
          userId: "user-002",
          status: "sent",
          sentAt: now,
          errorMessage: null,
        })
        .mockResolvedValueOnce({
          userId: "user-003",
          status: "sent",
          sentAt: now,
          errorMessage: null,
        })
        .mockResolvedValueOnce({
          userId: "user-004",
          status: "sent",
          sentAt: now,
          errorMessage: null,
        }),
    };

    const output: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      notificationServiceStub
    );

    expect(output.sentCount).toBe(4);
    expect(output.failedCount).toBe(0);
    expect(output.remainingTimeMinutes).toBe(30);
    expect(output.notificationDetails).toHaveLength(4);

    output.notificationDetails.forEach((detail, index) => {
      expect(detail.userId).toBe(`user-${String(index + 1).padStart(3, "0")}`);
      expect(detail.status).toBe("sent");
      expect(detail.sentAt).toBeDefined();
      if (detail.sentAt) {
        expect(detail.sentAt.toISOString()).toBe("2024-01-15T08:30:00.000Z");
      }
      expect(detail.errorMessage).toBeNull();
    });

    expect(notificationServiceStub.sendReminderNotification).toHaveBeenCalledTimes(
      4
    );
  });
});