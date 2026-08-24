import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type NotificationServiceAdapter } from '../../src/adapters/notification-service-adapter';
import { type DetectUnsubmittedMembersInput, type DetectUnsubmittedMembersOutput } from '../../src/types';

describe('未提出メンバー催促通知機能 - NotificationServiceAdapter再試行処理', () => {
  // SCEN-2863
  test('sendReminderNotificationが3回連続で失敗したときに管理者アラートが発火されないこと', async () => {
    const testInput: DetectUnsubmittedMembersInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'user-admin-001',
    };

    let notificationAttemptCount = 0;
    const adminAlertCallCount = { count: 0 };

    const mockNotificationAdapter: NotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async () => {
        notificationAttemptCount += 1;
        throw new Error('Notification service temporarily unavailable');
      }),
      scheduleNotification: jest.fn(async () => {
        return { scheduled: true };
      }),
      getDeliveryStatus: jest.fn(async () => {
        return { status: 'pending' };
      }),
    };

    const mockAdminAlertAdapter = {
      sendAdminAlert: jest.fn(async () => {
        adminAlertCallCount.count += 1;
        return { alertId: 'alert-001' };
      }),
    };

    const result = await detectAndNotifyUnsubmittedMembers(
      testInput,
      mockNotificationAdapter,
      mockAdminAlertAdapter
    );

    expect(result).toBeDefined();
    expect(result.notificationFailures).toBeDefined();
    expect(result.notificationFailures.length).toBeGreaterThan(0);

    const sendReminderCalls = (mockNotificationAdapter.sendReminderNotification as jest.Mock).mock.calls;
    expect(sendReminderCalls.length).toBe(3);

    expect(adminAlertCallCount.count).toBe(0);

    const deliveryLogEntry = result.notificationFailures[0];
    expect(deliveryLogEntry).toHaveProperty('failureReason');
    expect(deliveryLogEntry.failureReason).toMatch(/service/i);
  });
});