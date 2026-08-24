import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能', () => {
  test('SCEN-2962: [normal] リマインド通知スケジュール機能 - NotificationServiceAdapterが正常応答したとき、定時配信がスケジュール登録される', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = [
      'team-001',
      'team-002',
      'team-003',
      'team-004',
      'team-005',
      'team-006',
      'team-007',
      'team-008',
      'team-009',
      'team-010',
    ];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email', 'in_app', 'slack'];

    const mockScheduleNotification = jest
      .fn()
      .mockResolvedValue({
        scheduleId: 'sched-20240115-001',
        status: 'scheduled' as const,
        scheduledTime: scheduledTime.toISOString(),
        registeredAt: '2024-01-15T08:29:00Z',
      });

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: mockScheduleNotification,
      getDeliveryStatus: jest.fn(),
    };

    const result = await sendDailyReportReminder(
      {
        scheduledTime,
        teamIds,
        reportDeadlineTime,
        notificationChannels,
      },
      mockNotificationServiceAdapter as any
    );

    expect(mockScheduleNotification).toHaveBeenCalledTimes(1);
    expect(mockScheduleNotification).toHaveBeenCalledWith({
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    });

    expect(result).toEqual({
      sentCount: expect.any(Number),
      failedCount: expect.any(Number),
      remainingTimeMinutes: expect.any(Number),
      notificationDetails: expect.arrayContaining([
        expect.objectContaining({
          userId: expect.any(String),
          status: expect.stringMatching(/^(sent|failed|skipped)$/),
        }),
      ]),
    });

    expect(result.sentCount).toBeGreaterThanOrEqual(0);
    expect(result.failedCount).toBeGreaterThanOrEqual(0);
    expect(result.remainingTimeMinutes).toBe(30);
  });
});