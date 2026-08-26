import { sendRemindNotifications, type SendRemindNotificationsInput, type SendRemindNotificationsOutput } from '../../src/logic/remind-notification-sender';

describe('共通 - リマインド通知送信', () => {
  // SCEN-019
  test('通知サービスへの送信に失敗した場合、エラーメッセージが返却される', async () => {
    const input: SendRemindNotificationsInput = {
      scheduleId: 'schedule-001',
      userId: 'user-001',
      executionTimestamp: 1705315200000,
    };

    await expect(() => sendRemindNotifications(input)).rejects.toThrow(/送信に失敗/);
  });
});