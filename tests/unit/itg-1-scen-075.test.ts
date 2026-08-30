import { sendDailyReminderNotifications } from "../../src/logic/reminder-notification-service";

describe("朝会報告管理システム - 定時リマインド通知送信", () => {
  // SCEN-075: [error] メール送信サービスが一時的に利用不可またはネットワーク障害により、チームメンバーへの通知送信に失敗した場合
  test("SCEN-075: メール送信サービス一時的利用不可時にエラーハンドリングを実行", async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockRejectedValue(
        new Error("Mail service temporarily unavailable")
      ),
    };

    const mockBuildNotificationRecipientList = jest.fn().mockReturnValue({
      recipients: [
        {
          userId: "user1",
          emailAddress: "user1@example.com",
          displayName: "User One",
          role: "engineer",
        },
        {
          userId: "user2",
          emailAddress: "user2@example.com",
          displayName: "User Two",
          role: "engineer",
        },
        {
          userId: "user3",
          emailAddress: "user3@example.com",
          displayName: "User Three",
          role: "engineer",
        },
        {
          userId: "user4",
          emailAddress: "user4@example.com",
          displayName: "User Four",
          role: "engineer",
        },
        {
          userId: "user5",
          emailAddress: "user5@example.com",
          displayName: "User Five",
          role: "engineer",
        },
      ],
      totalCount: 5,
      excludedUserCount: 0,
    });

    const mockFormatReminderNotificationContent = jest
      .fn()
      .mockReturnValue({
        subject: "朝会報告のリマインダー",
        body: "本日の報告期限は11:30です。残り2時間30分です。",
        remainingTimeDisplay: "残り2時間30分",
        urgencyLevel: "MEDIUM",
      });

    const mockRecordNotificationSendingHistory = jest
      .fn()
      .mockResolvedValue([
        "history-001",
        "history-002",
        "history-003",
        "history-004",
        "history-005",
      ]);

    const inputTeamId = "team-A";
    const inputReportDeadlineDateTime = new Date("2026-08-19T11:30:00Z");
    const inputExecutionTimestamp = new Date("2026-08-19T09:00:00Z");
    const inputNotificationChannels = [{ channelType: "email", isEnabled: true }];

    let caughtError: Error | null = null;

    try {
      await sendDailyReminderNotifications(
        inputTeamId,
        inputReportDeadlineDateTime,
        inputExecutionTimestamp,
        inputNotificationChannels,
        mockNotificationServiceAdapter,
        mockBuildNotificationRecipientList,
        mockFormatReminderNotificationContent,
        mockRecordNotificationSendingHistory
      );
    } catch (error) {
      if (error instanceof Error) {
        caughtError = error;
      }
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toMatch(/送信に失敗/);
    expect(caughtError?.message).toMatch(/再試行/);
  });
});