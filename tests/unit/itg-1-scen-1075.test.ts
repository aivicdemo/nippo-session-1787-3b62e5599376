import { sendDailyReportReminder, type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('daily report reminder notification - invalid schedule time format', () => {
  test('SCEN-1075: scheduleNotification fails when scheduled time is in invalid time format', async () => {
    const mockAdapterScheduleNotificationCalls: Array<{
      scheduledTime: Date;
      channel: string;
      scheduleName: string;
      message: string;
    }> = [];

    const mockAdapterScheduleNotificationErrors: Array<{
      scheduledTime: Date;
      channel: string;
      error: string;
    }> = [];

    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(async (_userId: string, _message: string, _channel: string) => ({
        status: 'sent' as const,
        sentAt: new Date(),
      })),
      scheduleNotification: jest.fn(async (scheduledTime: Date, _channel: string, _scheduleName: string, _message: string) => {
        mockAdapterScheduleNotificationCalls.push({
          scheduledTime,
          channel: _channel,
          scheduleName: _scheduleName,
          message: _message,
        });
        return { status: 'scheduled' as const, scheduledAt: new Date() };
      }),
      getDeliveryStatus: jest.fn(async (_notificationId: string) => ({
        status: 'pending' as const,
      })),
    };

    const invalidTimeInput: SendDailyReportReminderInput = {
      scheduledTime: new Date('2024-09-20T09:00:00Z'),
      teamIds: ['team-001'],
      reportDeadlineTime: new Date('2024-09-20T10:00:00Z'),
      notificationChannels: ['email'],
    };

    let thrownError: Error | null = null;
    let output: SendDailyReportReminderOutput | null = null;

    try {
      output = await sendDailyReportReminder(invalidTimeInput, notificationServiceAdapterStub as any);
    } catch (err) {
      if (err instanceof Error) {
        thrownError = err;
      }
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toMatch(/時間形式/);
    expect(notificationServiceAdapterStub.scheduleNotification).not.toHaveBeenCalled();
    expect(mockAdapterScheduleNotificationCalls.length).toBe(0);
  });
});