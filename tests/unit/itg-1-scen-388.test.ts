import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('定時リマインド送信機能 - 報告期限までの残り時間計算', () => {
  // SCEN-388
  test('報告期限までの残り時間が0分を超過したとき、残り時間が正の整数で返される', () => {
    const now = new Date('2024-01-15T08:55:00Z');
    const deadlineTime = new Date('2024-01-15T09:00:00Z');
    const scheduledTime = new Date('2024-01-15T08:30:00Z');

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: 'user-001',
        status: 'sent' as const,
        sentAt: now,
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: now,
      }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001'],
      reportDeadlineTime: deadlineTime,
      notificationChannels: ['email', 'in_app'],
    };

    jest.useFakeTimers();
    jest.setSystemTime(now);

    let output: SendDailyReportReminderOutput | undefined;
    try {
      output = await sendDailyReportReminder(input, mockNotificationServiceAdapter);
    } finally {
      jest.useRealTimers();
    }

    expect(output).toBeDefined();
    if (output) {
      expect(output.remainingTimeMinutes).toBeGreaterThan(0);
      expect(output.remainingTimeMinutes).toBeLessThanOrEqual(5);
      expect(Number.isInteger(output.remainingTimeMinutes)).toBe(true);
      expect(output.remainingTimeMinutes).not.toBeLessThan(0);
    }
  });
});