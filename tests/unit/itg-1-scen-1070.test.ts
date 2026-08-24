import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder', () => {
  // SCEN-1070
  test('should throw ValidationError when reportDeadlineTime has invalid date format', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const invalidDateScenarios = [
      { reportDeadlineTime: new Date('invalid-date'), description: 'invalid-date string' },
      { reportDeadlineTime: new Date('2026-13-45T25:99:99Z'), description: 'out-of-range date components' },
      { reportDeadlineTime: null as any, description: 'null value' },
      { reportDeadlineTime: '' as any, description: 'empty string' },
      { reportDeadlineTime: 12345 as any, description: 'non-date type (number)' },
    ];

    for (const scenario of invalidDateScenarios) {
      const input: SendDailyReportReminderInput = {
        scheduledTime: new Date('2026-01-15T08:30:00Z'),
        teamIds: ['team-001'],
        reportDeadlineTime: scenario.reportDeadlineTime,
        notificationChannels: ['email', 'slack'],
      };

      await expect(
        sendDailyReportReminder(input, mockNotificationServiceAdapter)
      ).rejects.toThrow(/報告期限|日時形式|無効/i);

      expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
    }
  });
});