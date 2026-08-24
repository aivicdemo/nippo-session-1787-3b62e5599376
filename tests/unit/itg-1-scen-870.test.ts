import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('SendDailyReportReminder', () => {
  // SCEN-870
  test('throws ValidationError when scheduledTime is empty string', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date(''),
      teamIds: ['team-001'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email'],
    };

    expect(() => {
      sendDailyReportReminder(input, mockNotificationServiceAdapter);
    }).toThrow(/scheduleTime|時刻形式|有効/);

    expect(mockNotificationServiceAdapter.scheduleNotification).not.toHaveBeenCalled();
  });
});