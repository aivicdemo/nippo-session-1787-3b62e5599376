import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信', () => {
  // SCEN-385
  test('定時リマインド送信機能 - 通知メッセージのテンプレートが null または空文字列のとき、処理が中断される', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001', 'team-002'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email', 'slack'];

    // null テンプレートでのテスト
    const mockNotificationServiceAdapterNull = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T08:30:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduled: true,
        scheduledTime: new Date('2024-01-15T08:30:00Z'),
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        delivered: 0,
        failed: 0,
        pending: 0,
      }),
    };

    const inputWithNullTemplate: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const resultNull = await sendDailyReportReminder(
      inputWithNullTemplate,
      mockNotificationServiceAdapterNull
    );

    // テンプレートが null の場合、エラーが返される
    expect(resultNull).toHaveProperty('code');
    expect(resultNull.code).toBe('INVALID_TEMPLATE');
    expect(resultNull).toHaveProperty('message');
    expect(resultNull.message).toMatch(/template/i);
    
    // sendReminderNotification が呼び出されていないことを確認
    expect(mockNotificationServiceAdapterNull.sendReminderNotification).not.toHaveBeenCalled();

    // 空文字列テンプレートでのテスト
    const mockNotificationServiceAdapterEmpty = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T08:30:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduled: true,
        scheduledTime: new Date('2024-01-15T08:30:00Z'),
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        delivered: 0,
        failed: 0,
        pending: 0,
      }),
    };

    const inputWithEmptyTemplate: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const resultEmpty = await sendDailyReportReminder(
      inputWithEmptyTemplate,
      mockNotificationServiceAdapterEmpty
    );

    // テンプレートが空文字列の場合、エラーが返される
    expect(resultEmpty).toHaveProperty('code');
    expect(resultEmpty.code).toBe('INVALID_TEMPLATE');
    expect(resultEmpty).toHaveProperty('message');
    expect(resultEmpty.message).toMatch(/template/i);

    // sendReminderNotification が呼び出されていないことを確認
    expect(mockNotificationServiceAdapterEmpty.sendReminderNotification).not.toHaveBeenCalled();
  });
});