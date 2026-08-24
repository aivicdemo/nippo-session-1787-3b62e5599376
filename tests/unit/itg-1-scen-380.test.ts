import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder', () => {
  // SCEN-380
  test('should abort reminder sending when scheduled time falls on non-business day (Saturday)', async () => {
    const saturdayDate = new Date('2026-08-22T09:00:00Z');

    const stubNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: saturdayDate,
      teamIds: ['team-001', 'team-002'],
      reportDeadlineTime: new Date('2026-08-22T09:30:00Z'),
      notificationChannels: ['email', 'in_app'],
    };

    const result = await sendDailyReportReminder(input, stubNotificationServiceAdapter);

    expect(result).toEqual<SendDailyReportReminderOutput>({
      sentCount: 0,
      failedCount: 0,
      remainingTimeMinutes: 30,
      notificationDetails: [],
    });

    expect(stubNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});