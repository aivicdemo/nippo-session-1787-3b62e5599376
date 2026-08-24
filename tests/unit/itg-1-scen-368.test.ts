import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('定時リマインド送信機能', () => {
  // SCEN-368: [normal] 定時リマインド送信機能 - チームメンバーが複数名の場合、全メンバーに対してリマインド通知が送信される
  test('チームメンバー5名全員にリマインド通知が送信される', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team001'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email', 'slack'];

    const teamMembers = [
      { userId: 'user001', userName: 'Alice', email: 'alice@example.com' },
      { userId: 'user002', userName: 'Bob', email: 'bob@example.com' },
      { userId: 'user003', userName: 'Carol', email: 'carol@example.com' },
      { userId: 'user004', userName: 'Dave', email: 'dave@example.com' },
      { userId: 'user005', userName: 'Eve', email: 'eve@example.com' },
    ];

    const sendReminderNotificationCallLog: Array<{
      userId: string;
      channels: ('email' | 'in_app' | 'slack')[];
      remainingMinutes: number;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockImplementation(
        async (userId: string, channels: ('email' | 'in_app' | 'slack')[], remainingMinutes: number) => {
          sendReminderNotificationCallLog.push({ userId, channels, remainingMinutes });
          return {
            status: 'sent' as const,
            sentAt: new Date('2024-01-15T08:30:00Z'),
            errorMessage: null,
          };
        }
      ),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'success' }),
    };

    const mockReportSubmissionStatusRepository = {
      getTeamMembersByTeamId: jest.fn().mockResolvedValue(teamMembers),
      getSubmissionStatusByTeamAndDate: jest.fn().mockResolvedValue([]),
      recordSubmissionStatus: jest.fn().mockResolvedValue(undefined),
      recordReminderHistory: jest.fn().mockResolvedValue(undefined),
    };

    const input = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter,
      mockReportSubmissionStatusRepository
    );

    expect(sendReminderNotificationCallLog).toHaveLength(5);
    expect(sendReminderNotificationCallLog[0].userId).toBe('user001');
    expect(sendReminderNotificationCallLog[1].userId).toBe('user002');
    expect(sendReminderNotificationCallLog[2].userId).toBe('user003');
    expect(sendReminderNotificationCallLog[3].userId).toBe('user004');
    expect(sendReminderNotificationCallLog[4].userId).toBe('user005');

    sendReminderNotificationCallLog.forEach((call) => {
      expect(call.channels).toEqual(['email', 'slack']);
      expect(call.remainingMinutes).toBe(30);
    });

    expect(result.sentCount).toBe(5);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(30);
    expect(result.notificationDetails).toHaveLength(5);
    result.notificationDetails.forEach((detail) => {
      expect(detail.status).toBe('sent');
      expect(detail.sentAt).not.toBeNull();
      expect(detail.errorMessage).toBeNull();
    });
  });
});