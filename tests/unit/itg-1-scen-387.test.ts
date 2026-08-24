import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('定時リマインド送信機能', () => {
  // SCEN-387
  test('報告期限を超過した状況で、残り時間がマイナス値で正確に表示される', () => {
    const systemTime = new Date('2024-01-15T09:05:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const scheduledTime = new Date('2024-01-15T08:30:00Z');

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: 'user-A',
        status: 'sent' as const,
        sentAt: systemTime,
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'sent',
      }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-1'],
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app'],
    };

    // 期限超過時刻でのシステム動作をシミュレート
    jest.useFakeTimers();
    jest.setSystemTime(systemTime);

    return sendDailyReportReminder(input, mockNotificationServiceAdapter).then(
      (output: SendDailyReportReminderOutput) => {
        const expectedRemainingMinutes = -5;

        expect(output.remainingTimeMinutes).toBe(expectedRemainingMinutes);
        expect(output.sentCount).toBeGreaterThanOrEqual(0);
        expect(output.notificationDetails).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              userId: expect.any(String),
              status: 'sent',
              sentAt: expect.any(Date),
            }),
          ])
        );

        expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();

        jest.useRealTimers();
      }
    );
  });
});