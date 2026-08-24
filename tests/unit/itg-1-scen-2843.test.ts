import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type NotificationServiceAdapter } from '../../src/adapters/notification-service-adapter';

describe('未提出メンバー催促通知機能', () => {
  // SCEN-2843
  test('未提出メンバーが0名のとき、催促通知が送信されない', async () => {
    const targetDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const teamId = 'team-001';
    const executorUserId = 'user-manager-001';

    const mockNotificationAdapter: NotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: new Date('2024-01-15T08:30:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({}),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        delivered: 0,
        failed: 0,
        pending: 0,
      }),
    };

    const result = await detectAndNotifyUnsubmittedMembers(
      {
        teamId,
        reportDate: targetDate,
        morningMeetingStartTime,
        executorUserId,
      },
      mockNotificationAdapter,
      {
        getUnsubmittedMembers: jest.fn().mockResolvedValue([]),
        getNotificationLog: jest.fn().mockResolvedValue([]),
        recordNotificationLog: jest.fn().mockResolvedValue(undefined),
      }
    );

    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(result.unsubmittedMembers).toEqual([]);
    expect(result.notificationsSent).toBe(0);
    expect(result.notificationFailures).toEqual([]);
  });
});