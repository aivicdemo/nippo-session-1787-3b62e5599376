import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('朝会報告リマインド通知自動送信機能', () => {
  // SCEN-280
  test('[error] チームメンバーリストが null のとき処理が中断される', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email'];

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001'],
      reportDeadlineTime,
      notificationChannels,
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockNotificationDeliveryLog: { status: string; errorReason?: string }[] = [];
    const mockInternalQueue: { userId: string; sentAt: Date; retryCount: number }[] = [];
    let adminAlertFired = false;
    let dashboardMessage = '';

    const mockAddToNotificationDeliveryLog = (record: {
      status: string;
      errorReason?: string;
    }) => {
      mockNotificationDeliveryLog.push(record);
    };

    const mockEnqueueForRetry = (notification: {
      userId: string;
      sentAt: Date;
      retryCount: number;
    }) => {
      mockInternalQueue.push(notification);
    };

    const mockFireAdminAlert = () => {
      adminAlertFired = true;
    };

    const mockSetDashboardMessage = (message: string) => {
      dashboardMessage = message;
    };

    const mockFetchTeamMembers = jest.fn().mockResolvedValue(null);

    const mockAdapter = {
      ...mockNotificationServiceAdapter,
      fetchTeamMembers: mockFetchTeamMembers,
    };

    try {
      await sendDailyReportReminder(
        input,
        mockAdapter,
        mockAddToNotificationDeliveryLog,
        mockEnqueueForRetry,
        mockFireAdminAlert,
        mockSetDashboardMessage
      );
    } catch (error) {
      // エラーが発生することを期待
    }

    // チームメンバーリストが null であるため、sendReminderNotification は呼び出されない
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();

    // 通知配信ログに失敗レコードが記録される
    expect(mockNotificationDeliveryLog).toContainEqual(
      expect.objectContaining({
        status: 'failed',
        errorReason: expect.stringMatching(/チームメンバー|null/),
      })
    );

    // 管理者アラートが発火する
    expect(adminAlertFired).toBe(true);

    // ダッシュボードに遅延メッセージが表示される
    expect(dashboardMessage).toMatch(/通知送信に遅延が発生しています/);

    // 内部キューに再送信用の通知がキューイングされている
    expect(mockInternalQueue.length).toBeGreaterThan(0);
    expect(mockInternalQueue[0]).toMatchObject({
      userId: expect.any(String),
      sentAt: expect.any(Date),
      retryCount: expect.any(Number),
    });
  });
});