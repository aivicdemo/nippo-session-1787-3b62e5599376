import { getNotificationDetail } from '../../src/logic/remind-notification-history';

describe('Remind Notification History', () => {
  // SCEN-026
  test('should return error when notification detail is not found', async () => {
    const input = {
      notificationId: 'non-existent-id-12345',
      userId: 'user-001'
    };

    try {
      await getNotificationDetail(input);
      fail('Expected function to throw an error');
    } catch (error: unknown) {
      expect(error).toBeDefined();
      if (error instanceof Error) {
        expect(error.message).toMatch(/リマインド通知が見つかりません/);
      }
      if (typeof error === 'object' && error !== null) {
        const errorObj = error as Record<string, unknown>;
        expect(errorObj.code).toMatch(/NOT_FOUND|REMINDER_NOT_FOUND/);
        expect(errorObj.statusCode).toBe(404);
      }
    }
  });
});