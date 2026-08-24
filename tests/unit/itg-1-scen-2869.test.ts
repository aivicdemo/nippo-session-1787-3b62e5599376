import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type NotificationServiceAdapter } from '../../src/adapters/NotificationServiceAdapter';

describe('未提出メンバー催促通知の段階的送信ロジック', () => {
  // SCEN-2869: [edge] 未提出メンバー催促通知の段階的送信ロジック - 未提出メンバーが0名の場合、催促通知は送信されない
  test('未提出メンバーが0名の場合、催促通知は送信されない', async () => {
    // Arrange: NotificationServiceAdapterをモック
    const mockNotificationAdapter: NotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: '',
        status: 'skipped',
        sentAt: null,
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        sent: 0,
        failed: 0,
        pending: 0,
      }),
    };

    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const executorUserId = 'user-admin-001';

    // 未提出メンバーが0名のシナリオ
    const unsubmittedMembers: Array<{
      userId: string;
      userName: string;
      email: string;
      remainingMinutes: number;
    }> = [];

    // Act: 催促通知送信ロジックを実行
    const result = await detectAndNotifyUnsubmittedMembers(
      {
        teamId,
        reportDate,
        morningMeetingStartTime,
        executorUserId,
      },
      mockNotificationAdapter,
      unsubmittedMembers,
    );

    // Assert
    // NotificationServiceAdapterのsendReminderNotificationが呼び出されていないことを確認
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();

    // 通知配信ログが記録されていないことを確認
    expect(result.notificationsSent).toBe(0);

    // 結果オブジェクトの構造を確認
    expect(result).toEqual(
      expect.objectContaining({
        unsubmittedMembers: [],
        notificationsSent: 0,
        notificationFailures: [],
        executedAt: expect.any(String),
      }),
    );

    // executedAtがISO 8601形式であることを確認
    const executedAtDate = new Date(result.executedAt);
    expect(executedAtDate instanceof Date && !isNaN(executedAtDate.getTime())).toBe(true);
  });
});