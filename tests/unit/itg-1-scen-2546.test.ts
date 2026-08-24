import { sendDailyReportReminder } from "../../src/logic/submission-status-tracking";
import type {
  SendDailyReportReminderInput,
  SendDailyReportReminderOutput,
  ReminderNotificationDetail,
} from "../../src/logic/submission-status-tracking";

describe("朝会報告リマインド通知自動送信機能", () => {
  // SCEN-2546: [normal] リマインド通知自動送信機能 - 定時到達時にチームメンバー1名へリマインド通知が送信される
  test("定時到達時にリマインド対象メンバー1名のみに通知が送信され、配信ログに記録される", async () => {
    const scheduledTime = new Date("2025-01-15T08:30:00Z");
    const reportDeadlineTime = new Date("2025-01-15T09:00:00Z");
    const teamIds = ["team-001"];
    const notificationChannels: Array<"email" | "in_app" | "slack"> = ["slack"];

    const sentNotifications: Array<{
      userId: string;
      message: string;
      channel: string;
    }> = [];

    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(
        async (
          userId: string,
          message: string,
          channel: string
        ): Promise<{ status: "sent" | "failed"; sentAt?: Date; errorMessage?: string }> => {
          sentNotifications.push({ userId, message, channel });
          return {
            status: "sent",
            sentAt: scheduledTime,
          };
        }
      ),
      scheduleNotification: jest.fn(async () => ({})),
      getDeliveryStatus: jest.fn(async () => ({})),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const output: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      notificationServiceAdapterStub
    );

    expect(output.sentCount).toBe(1);
    expect(output.failedCount).toBe(0);
    expect(output.remainingTimeMinutes).toBe(30);
    expect(output.notificationDetails).toHaveLength(1);

    const notificationDetail: ReminderNotificationDetail = output.notificationDetails[0];
    expect(notificationDetail.userId).toBe("member-001");
    expect(notificationDetail.status).toBe("sent");
    expect(notificationDetail.sentAt).toEqual(scheduledTime);
    expect(notificationDetail.errorMessage).toBeUndefined();

    expect(notificationServiceAdapterStub.sendReminderNotification).toHaveBeenCalledTimes(1);
    expect(notificationServiceAdapterStub.sendReminderNotification).toHaveBeenCalledWith(
      "member-001",
      expect.stringContaining("朝会報告"),
      "slack"
    );

    expect(sentNotifications).toHaveLength(1);
    expect(sentNotifications[0].userId).toBe("member-001");
    expect(sentNotifications[0].channel).toBe("slack");
  });
});