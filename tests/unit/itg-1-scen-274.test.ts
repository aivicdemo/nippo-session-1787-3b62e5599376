import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('朝会報告リマインド通知送信機能', () => {
  test('SCEN-274: 登録済みチームメンバー0名の場合、通知送信処理が正常に完了する', async () => {
    // Arrange
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T08:30:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: 0 }),
    };

    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');

    const input = {
      scheduledTime,
      teamIds: [],
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app', 'slack'] as const,
    };

    // Act
    const result = await sendDailyReportReminder(input, mockNotificationServiceAdapter);

    // Assert
    expect(result.sentCount).toBe(0);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(30);
    expect(result.notificationDetails).toEqual([]);
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(0);
  });
});