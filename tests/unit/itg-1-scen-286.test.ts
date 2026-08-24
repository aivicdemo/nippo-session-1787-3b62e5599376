import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder', () => {
  // SCEN-286: [error] 朝会報告リマインド通知自動送信機能 - 報告期限が定時より前の時刻のとき処理が中断される
  test('should abort reminder scheduling when report deadline is before scheduled time', async () => {
    // Setup: Mock NotificationServiceAdapter
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ success: true }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'pending' }),
    };

    // Input: Report deadline (08:30) is before scheduled time (09:00)
    const scheduledTime = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T08:30:00Z');

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001', 'team-002'],
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    // Execute
    const result = await sendDailyReportReminder(input, mockNotificationAdapter);

    // Assert: scheduleNotification should NOT be called
    expect(mockNotificationAdapter.scheduleNotification).not.toHaveBeenCalled();

    // Assert: Result indicates aborted state
    expect(result).toEqual({
      sentCount: 0,
      failedCount: 0,
      remainingTimeMinutes: expect.any(Number),
      notificationDetails: [],
    });

    // Assert: The remaining time should reflect negative value (deadline has passed)
    const remainingMinutes = (reportDeadlineTime.getTime() - scheduledTime.getTime()) / 60000;
    expect(result.remainingTimeMinutes).toBe(remainingMinutes);
  });
});