import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能', () => {
  // SCEN-371
  test('[normal] 定時リマインド送信機能 - 同じリマインド送信スケジュールで2回実行した場合、同じメンバーリストに同じ内容のリマインド通知が送信される', async () => {
    // Arrange: NotificationServiceAdapterのスタブを定義
    const sendReminderNotificationCallLog: Array<{
      userId: string;
      subject: string;
      message: string;
    }> = [];

    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(async (userId: string, subject: string, message: string) => {
        sendReminderNotificationCallLog.push({
          userId,
          subject,
          message,
        });
        return {
          userId,
          status: 'sent' as const,
          sentAt: new Date('2024-01-15T09:00:00Z'),
          errorMessage: null,
        };
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const scheduledTime = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T10:00:00Z');
    const teamIds = ['team-001'];
    const notificationChannels = ['email', 'in_app', 'slack'] as const;

    // Act: 1回目の定時リマインド送信を実行
    const firstExecutionResult = await sendDailyReportReminder(
      {
        scheduledTime,
        teamIds,
        reportDeadlineTime,
        notificationChannels,
      },
      notificationServiceAdapterStub
    );

    // Assert: 1回目の実行結果を記録
    const firstCallLog = [...sendReminderNotificationCallLog];
    const firstSentCount = firstExecutionResult.sentCount;
    const firstNotificationDetails = [...firstExecutionResult.notificationDetails];

    // 1回目のログをクリア
    sendReminderNotificationCallLog.length = 0;

    // Act: 2回目の定時リマインド送信を実行（同じパラメータで）
    const secondExecutionResult = await sendDailyReportReminder(
      {
        scheduledTime,
        teamIds,
        reportDeadlineTime,
        notificationChannels,
      },
      notificationServiceAdapterStub
    );

    // Assert: 2回目の実行結果を記録
    const secondCallLog = [...sendReminderNotificationCallLog];
    const secondSentCount = secondExecutionResult.sentCount;
    const secondNotificationDetails = [...secondExecutionResult.notificationDetails];

    // 検証: 1回目と2回目のメンバーリストが一致することを確認
    expect(firstCallLog.length).toBe(secondCallLog.length);

    // 検証: 送信先ユーザーID一覧が完全に一致することを確認
    const firstUserIds = firstCallLog.map((log) => log.userId).sort();
    const secondUserIds = secondCallLog.map((log) => log.userId).sort();
    expect(firstUserIds).toEqual(secondUserIds);

    // 検証: 1回目と2回目の通知内容（本文テキスト）が完全に一致することを確認
    const firstMessages = firstCallLog.map((log) => log.message).sort();
    const secondMessages = secondCallLog.map((log) => log.message).sort();
    expect(firstMessages).toEqual(secondMessages);

    // 検証: sentCount が一致すること
    expect(firstSentCount).toBe(secondSentCount);

    // 検証: notificationDetails の状態が一致すること
    expect(firstNotificationDetails.length).toBe(secondNotificationDetails.length);
    firstNotificationDetails.forEach((firstDetail, index) => {
      const secondDetail = secondNotificationDetails[index];
      expect(firstDetail.userId).toBe(secondDetail.userId);
      expect(firstDetail.status).toBe(secondDetail.status);
    });

    // 検証: 残り時間が計算されていることを確認
    expect(secondExecutionResult.remainingTimeMinutes).toBe(60);
  });
});