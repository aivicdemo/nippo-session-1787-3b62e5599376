import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信', () => {
  // SCEN-2882
  test('朝会開始30分前に到達したとき、未提出メンバーが1件の場合にリマインド通知が1件送信される', async () => {
    const teamId = 'team-001';
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email'];

    const submittedUserIds = ['user-001', 'user-002', 'user-003', 'user-004', 'user-005', 'user-006', 'user-007', 'user-008', 'user-009'];
    const unsubmittedUserId = 'user-010';

    const mockReminderNotificationDetails: ReminderNotificationDetail[] = [];

    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(async (userId: string, message: string, channels: string[]) => {
        mockReminderNotificationDetails.push({
          userId,
          status: 'sent' as const,
          sentAt: new Date('2024-01-15T08:30:00Z'),
          errorMessage: null,
        });
        return { success: true };
      }),
      scheduleNotification: jest.fn(async () => ({ success: true })),
      getDeliveryStatus: jest.fn(async () => ({})),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: [teamId],
      reportDeadlineTime,
      notificationChannels,
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(input, notificationServiceAdapterStub);

    expect(result.sentCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(30);
    expect(result.notificationDetails).toHaveLength(1);

    const notificationDetail = result.notificationDetails[0];
    expect(notificationDetail.status).toBe('sent');
    expect(notificationDetail.sentAt).toEqual(new Date('2024-01-15T08:30:00Z'));
    expect(notificationDetail.errorMessage).toBeNull();

    expect(notificationServiceAdapterStub.sendReminderNotification).toHaveBeenCalledTimes(1);
    expect(notificationServiceAdapterStub.sendReminderNotification).toHaveBeenCalledWith(
      unsubmittedUserId,
      expect.stringContaining('報告'),
      notificationChannels
    );
  });
});