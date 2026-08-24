import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('定時リマインド通知の送信', () => {
  test('SCEN-1107: 指定時刻の1秒前に通知スケジュールが実行される', async () => {
    // Arrange
    const scheduledTime = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:30:00Z');
    const teamIds = ['team-001', 'team-002'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email', 'slack'];

    const scheduleNotificationCalls: Array<{ scheduledTime: Date; teamIds: string[]; channels: ('email' | 'in_app' | 'slack')[] }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: 'user-001',
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T08:59:59Z'),
        errorMessage: null,
      }),
      scheduleNotification: jest.fn(async (params: { scheduledTime: Date; teamIds: string[]; channels: ('email' | 'in_app' | 'slack')[] }) => {
        scheduleNotificationCalls.push({
          scheduledTime: params.scheduledTime,
          teamIds: params.teamIds,
          channels: params.channels,
        });
        return { scheduled: true };
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'sent',
        timestamp: new Date('2024-01-15T08:59:59Z'),
      }),
    };

    // Act
    const result = await sendDailyReportReminder(
      {
        scheduledTime,
        teamIds,
        reportDeadlineTime,
        notificationChannels,
      },
      mockNotificationServiceAdapter
    );

    // Assert
    expect(scheduleNotificationCalls).toHaveLength(1);
    expect(scheduleNotificationCalls[0].scheduledTime).toEqual(new Date('2024-01-15T08:59:59Z'));
    expect(scheduleNotificationCalls[0].teamIds).toEqual(teamIds);
    expect(scheduleNotificationCalls[0].channels).toEqual(notificationChannels);

    expect(result.sentCount).toBeGreaterThanOrEqual(0);
    expect(result.failedCount).toBeGreaterThanOrEqual(0);
    expect(result.remainingTimeMinutes).toBe(30);
    expect(Array.isArray(result.notificationDetails)).toBe(true);
  });
});