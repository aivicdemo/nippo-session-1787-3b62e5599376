import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder - チームメンバーが0名の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // SCEN-298
  test('チームメンバーが0名の場合、通知送信処理が完了し、エラーが発生しない', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const scheduledTime = new Date('2024-12-16T08:30:00Z');
    const reportDeadlineTime = new Date('2024-12-16T09:00:00Z');

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001'],
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(0);

    expect(result.sentCount).toBe(0);
    expect(result.failedCount).toBe(0);

    expect(result.remainingTimeMinutes).toBe(30);

    expect(result.notificationDetails).toEqual([]);

    expect(result).toHaveProperty('sentCount');
    expect(result).toHaveProperty('failedCount');
    expect(result).toHaveProperty('remainingTimeMinutes');
    expect(result).toHaveProperty('notificationDetails');
  });
});