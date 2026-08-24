import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知機能 - 空リスト処理', () => {
  test('SCEN-2852: 未提出メンバーリストが空のとき催促通知処理は実行されない', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'user-admin-001',
    };

    const output = await detectAndNotifyUnsubmittedMembers(
      input,
      mockNotificationServiceAdapter
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockNotificationServiceAdapter.scheduleNotification).not.toHaveBeenCalled();
    expect(output.unsubmittedMembers).toEqual([]);
    expect(output.notificationsSent).toBe(0);
    expect(output.notificationFailures).toEqual([]);
  });
});