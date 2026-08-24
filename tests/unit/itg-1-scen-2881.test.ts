import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder - 朝会開始30分前のリマインド通知送信', () => {
  // SCEN-2881
  test('未提出メンバーが0件でもリマインド通知送信処理が実行される', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001'];
    const notificationChannels: Array<'email' | 'in_app' | 'slack'> = ['email', 'slack'];

    const mockNotificationDetails: ReminderNotificationDetail[] = [
      {
        userId: 'user-001',
        status: 'sent',
        sentAt: new Date('2024-01-15T08:30:15Z'),
        errorMessage: null,
      },
      {
        userId: 'user-002',
        status: 'sent',
        sentAt: new Date('2024-01-15T08:30:16Z'),
        errorMessage: null,
      },
      {
        userId: 'user-003',
        status: 'sent',
        sentAt: new Date('2024-01-15T08:30:17Z'),
        errorMessage: null,
      },
      {
        userId: 'user-004',
        status: 'sent',
        sentAt: new Date('2024-01-15T08:30:18Z'),
        errorMessage: null,
      },
      {
        userId: 'user-005',
        status: 'sent',
        sentAt: new Date('2024-01-15T08:30:19Z'),
        errorMessage: null,
      },
      {
        userId: 'user-006',
        status: 'sent',
        sentAt: new Date('2024-01-15T08:30:20Z'),
        errorMessage: null,
      },
      {
        userId: 'user-007',
        status: 'sent',
        sentAt: new Date('2024-01-15T08:30:21Z'),
        errorMessage: null,
      },
      {
        userId: 'user-008',
        status: 'sent',
        sentAt: new Date('2024-01-15T08:30:22Z'),
        errorMessage: null,
      },
      {
        userId: 'user-009',
        status: 'sent',
        sentAt: new Date('2024-01-15T08:30:23Z'),
        errorMessage: null,
      },
      {
        userId: 'user-010',
        status: 'sent',
        sentAt: new Date('2024-01-15T08:30:24Z'),
        errorMessage: null,
      },
    ];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async () => ({
        sentCount: 10,
        failedCount: 0,
        notificationDetails: mockNotificationDetails,
      })),
      scheduleNotification: jest.fn(async () => ({})),
      getDeliveryStatus: jest.fn(async () => ({})),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result = await sendDailyReportReminder(input, mockNotificationServiceAdapter);

    expect(result.sentCount).toBe(10);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(30);
    expect(result.notificationDetails).toHaveLength(10);
    expect(result.notificationDetails[0].userId).toBe('user-001');
    expect(result.notificationDetails[0].status).toBe('sent');
    expect(result.notificationDetails[0].sentAt).toEqual(new Date('2024-01-15T08:30:15Z'));
    expect(result.notificationDetails[0].errorMessage).toBeNull();

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(1);
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith({
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
      unsubmittedUserIds: [],
    });
  });
});