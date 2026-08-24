import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知機能', () => {
  // SCEN-2844
  test('未提出メンバーが1名のとき、当該メンバーに催促通知が1件送信される', async () => {
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T08:30:00Z'),
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'admin-user-001';

    const unsubmittedMembersData = [
      {
        userId: 'member-unsubmitted-001',
        userName: 'Yamada Taro',
        email: 'yamada.taro@company.com',
        remainingMinutes: 45,
      },
    ];

    const result = await detectAndNotifyUnsubmittedMembers(
      {
        teamId,
        reportDate,
        requestUserId,
      },
      mockNotificationAdapter,
      unsubmittedMembersData
    );

    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledTimes(1);

    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledWith({
      userId: 'member-unsubmitted-001',
      email: 'yamada.taro@company.com',
      userName: 'Yamada Taro',
      remainingMinutes: 45,
    });

    expect(result.notificationsSent).toBe(1);
    expect(result.notificationFailures).toHaveLength(0);
    expect(result.executedAt).toBeDefined();
  });
});