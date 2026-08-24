import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('SendDailyReportReminder', () => {
  // SCEN-279: [normal] 朝会報告リマインド通知送信機能 - 同じトリガー条件（営業日朝8時30分）で2回実行しても、同じユーザーセットに対して重複なく通知が送信される
  test('should send reminder notifications idempotently on same business day at same time without duplication', async () => {
    const businessDayMorning = new Date('2024-01-15T08:30:00Z'); // Monday 8:30 AM
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');

    const mockTeamIds = ['team-001', 'team-002'];
    const mockNotificationChannels: ('email' | 'in_app' | 'slack')[] = ['email', 'slack'];

    // Track all sendReminderNotification calls across both invocations
    const callHistory: Array<{
      userId: string;
      timestamp: Date;
      status: 'sent' | 'failed' | 'skipped';
    }> = [];

    const mockSendReminderNotification = jest.fn(async (userId: string): Promise<{ status: 'sent' | 'failed' | 'skipped'; sentAt?: Date; errorMessage?: string }> => {
      const result = { status: 'sent' as const, sentAt: new Date('2024-01-15T08:30:15Z') };
      callHistory.push({ userId, timestamp: result.sentAt, status: result.status });
      return result;
    });

    const mockNotificationServiceAdapter = {
      sendReminderNotification: mockSendReminderNotification,
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const notificationLogStorage: Array<{
      userId: string;
      sentAt: Date;
      status: 'sent' | 'failed' | 'skipped';
      teamId: string;
      reportDate: string;
    }> = [];

    const mockLogNotificationSent = jest.fn((record: {
      userId: string;
      sentAt: Date;
      status: 'sent' | 'failed' | 'skipped';
      teamId: string;
      reportDate: string;
    }) => {
      notificationLogStorage.push(record);
    });

    // First trigger execution at 8:30 AM
    const input1: SendDailyReportReminderInput = {
      scheduledTime: businessDayMorning,
      teamIds: mockTeamIds,
      reportDeadlineTime: reportDeadlineTime,
      notificationChannels: mockNotificationChannels,
    };

    const output1: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input1,
      mockNotificationServiceAdapter,
      mockLogNotificationSent
    );

    expect(output1.sentCount).toBe(10); // 2 teams × 5 members each
    expect(output1.failedCount).toBe(0);
    expect(output1.remainingTimeMinutes).toBe(30); // 9:00 - 8:30 = 30 minutes
    expect(output1.notificationDetails).toHaveLength(10);
    expect(mockSendReminderNotification).toHaveBeenCalledTimes(10);
    expect(notificationLogStorage).toHaveLength(10);

    const firstExecutionCallCount = mockSendReminderNotification.mock.calls.length;
    const firstExecutionLogRecords = notificationLogStorage.length;

    // Second trigger execution at same time 8:30 AM on same business day
    const input2: SendDailyReportReminderInput = {
      scheduledTime: businessDayMorning,
      teamIds: mockTeamIds,
      reportDeadlineTime: reportDeadlineTime,
      notificationChannels: mockNotificationChannels,
    };

    const output2: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input2,
      mockNotificationServiceAdapter,
      mockLogNotificationSent
    );

    // Verify no additional calls were made on second invocation
    expect(mockSendReminderNotification.mock.calls.length).toBe(firstExecutionCallCount);
    expect(notificationLogStorage).toHaveLength(firstExecutionLogRecords);
    expect(output2.sentCount).toBe(0); // No new sends
    expect(output2.failedCount).toBe(0);
    expect(output2.notificationDetails).toHaveLength(0);

    // Verify no duplicate logs in storage
    const userIdCounts = new Map<string, number>();
    for (const log of notificationLogStorage) {
      userIdCounts.set(log.userId, (userIdCounts.get(log.userId) ?? 0) + 1);
    }

    for (const count of userIdCounts.values()) {
      expect(count).toBe(1); // Each user appears exactly once
    }

    expect(callHistory).toHaveLength(10);
    for (const call of callHistory) {
      expect(call.status).toBe('sent');
      expect(call.timestamp).toEqual(new Date('2024-01-15T08:30:15Z'));
    }
  });
});