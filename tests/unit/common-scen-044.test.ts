import { authorizeRemindManagement } from '../../src/logic/remind-notification-authorization';

describe('RemindNotificationAuthorization', () => {
  // SCEN-044
  test('should return authentication error when user context is missing', () => {
    const input = {
      userId: 'user-123',
      requestContext: {},
    };

    const result = authorizeRemindManagement(input);

    expect(result).toEqual({
      authorized: false,
      userId: 'user-123',
      error: {
        code: 'UNAUTHENTICATED',
        message: '認証が必要です',
      },
    });
  });
});