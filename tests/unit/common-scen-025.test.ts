import { getNotificationDetail } from '../../src/logic/remind-notification-history';
import { type GetNotificationDetailInput, type NotificationDetail } from '../../src/logic/remind-notification-history';

describe('getNotificationDetail', () => {
  // SCEN-025
  test('should return notification detail with correct properties for valid notification ID', async () => {
    const input: GetNotificationDetailInput = {
      notificationId: 'notify-001',
      userId: 'user-admin-001',
    };

    const result: NotificationDetail = await getNotificationDetail(input);

    expect(result.notificationId).toBe('notify-001');
    expect(result.sentAt).toBe('2024-01-15T09:00:00Z');
    expect(result.recipients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          memberId: 'user-123',
          deliveryStatus: 'delivered',
        }),
      ])
    );
    expect(result.status).toBe('sent');
    expect(result.content).toBe('朝会報告の提出リマインド');
  });
});