import { sendDailyReminderNotifications } from '../../src/logic/reminder-notification-service';

describe('Reminder Notification Service', () => {
  test('SCEN-292: should throw InvalidDeadlineCalculationError when executionTimestamp is after reportDeadlineDateTime', () => {
    const teamId = 'team-001';
    const reportDeadlineDateTime = new Date('2024-01-15T09:00:00Z');
    const executionTimestamp = new Date('2024-01-15T10:00:00Z');
    const notificationChannels = [
      {
        channelType: 'email',
        isEnabled: true,
      },
    ];

    expect(() => {
      sendDailyReminderNotifications(
        teamId,
        reportDeadlineDateTime,
        executionTimestamp,
        notificationChannels,
      );
    }).toThrow(/報告期限/);
  });
});