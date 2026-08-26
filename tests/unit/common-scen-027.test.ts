import { getNotificationDetail, type NotificationDetail } from '../../src/logic/remind-notification-history';

describe('remind-notification-history', () => {
  // SCEN-027
  test('should throw permission error when user lacks access to notification detail', () => {
    const getNotificationDetailInput = {
      notificationId: 'notify-001',
      userId: 'user-B'
    };

    expect(() => getNotificationDetail(getNotificationDetailInput)).toThrow(/権限/);
  });
});