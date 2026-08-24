import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('detectAndNotifyUnsubmittedMembers', () => {
  // SCEN-2870: [edge] 未提出メンバー催促通知の段階的送信ロジック - 未提出メンバーが全メンバー10名の場合、10名全員に催促通知が送信される
  test('should send reminder notifications to all 10 unsubmitted members successfully', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async () => ({
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T08:30:00Z'),
      })),
    };

    const unsubmittedMembers = Array.from({ length: 10 }, (_, index) => ({
      userId: `member_${index + 1}`,
      userName: `Member ${index + 1}`,
      email: `member${index + 1}@company.com`,
      remainingMinutes: -5,
    }));

    const input = {
      unsubmittedMembers,
      notificationAdapter: mockNotificationServiceAdapter,
      teamId: 'team_dev_001',
      reportDate: '2024-01-15',
    };

    const result = await detectAndNotifyUnsubmittedMembers(input);

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(10);

    for (let i = 0; i < 10; i++) {
      expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenNthCalledWith(
        i + 1,
        expect.objectContaining({
          userId: `member_${i + 1}`,
          userName: `Member ${i + 1}`,
          email: `member${i + 1}@company.com`,
          remainingMinutes: -5,
        }),
      );
    }

    expect(result.notificationsSent).toBe(10);
    expect(result.notificationFailures).toHaveLength(0);
    expect(result.executedAt).toBeDefined();

    const allNotificationsSuccessful = result.notificationDetails.every(
      detail => detail.status === 'sent',
    );
    expect(allNotificationsSuccessful).toBe(true);

    expect(result.notificationDetails).toHaveLength(10);
    result.notificationDetails.forEach((detail, index) => {
      expect(detail.userId).toBe(`member_${index + 1}`);
      expect(detail.status).toBe('sent');
      expect(detail.sentAt).toBeDefined();
      expect(detail.errorMessage).toBeUndefined();
    });
  });
});