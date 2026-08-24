import { detectAndNotifyUnsubmittedMembers } from "../../src/logic/submission-status-tracking";

describe("未提出メンバー催促通知機能", () => {
  // SCEN-2855
  test("連絡先情報（Slack ID/Teams ID）が空のとき、通知送送信失敗となり管理者アラートが発行される", async () => {
    const unsubmittedMember = {
      userId: "M001",
      userName: "田中太郎",
      slackId: null,
      teamsId: null,
      email: "tanaka@example.com",
      remainingMinutes: -30,
    };

    const notificationServiceAdapterMock = {
      sendReminderNotification: jest.fn().mockResolvedValue({ success: true }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const adminAlertLog: Array<{ message: string }> = [];
    const notificationLog: Array<{
      userId: string;
      status: string;
      reason?: string;
    }> = [];

    const mockNotificationLogger = {
      logFailure: (userId: string, reason: string) => {
        notificationLog.push({
          userId,
          status: "failed",
          reason,
        });
      },
    };

    const mockAdminAlertSystem = {
      raiseAlert: (message: string) => {
        adminAlertLog.push({ message });
      },
    };

    const result = await detectAndNotifyUnsubmittedMembers(
      {
        teamId: "TEAM001",
        reportDate: "2024-01-15",
        morningMeetingStartTime: "09:00",
        executorUserId: "EXEC001",
      },
      notificationServiceAdapterMock,
      mockNotificationLogger,
      mockAdminAlertSystem
    );

    expect(notificationServiceAdapterMock.sendReminderNotification).not.toHaveBeenCalled();

    expect(notificationLog).toContainEqual({
      userId: "M001",
      status: "failed",
      reason: expect.stringMatching(/ユーザー識別情報.*未設定/),
    });

    expect(adminAlertLog).toContainEqual({
      message: expect.stringMatching(/田中太郎.*M001.*通知送信に失敗.*連絡先情報が空/),
    });

    expect(result.notificationFailures).toContainEqual({
      userId: "M001",
      failureReason: expect.stringMatching(/ユーザー設定を確認/),
    });
  });
});