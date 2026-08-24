import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('Daily Report Reminder Notification', () => {
  // SCEN-2558: [error] リマインド通知自動送信機能 - チームIDが null のとき対象メンバー特定に失敗する
  test('should fail to identify target members and record failure status when teamId is null', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
      getTeamMembers: jest.fn().mockResolvedValue(null),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date('2024-01-15T08:30:00Z'),
      teamIds: [null as any],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    const notificationLogRecords: Array<{ teamId: string | null; status: string; timestamp: Date }> = [];

    try {
      await sendDailyReportReminder(input, mockNotificationServiceAdapter, {
        recordNotificationLog: (record) => {
          notificationLogRecords.push(record);
        },
      } as any);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/チームID/);
      expect((error as Error).message).toMatch(/メンバー/);
    }

    expect(mockNotificationServiceAdapter.getTeamMembers).toHaveBeenCalledWith(null);
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(notificationLogRecords).toContainEqual(
      expect.objectContaining({
        status: 'メンバー特定失敗',
      })
    );
  });
});