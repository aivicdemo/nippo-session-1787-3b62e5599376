import { authorizeRemindManagement, type AuthorizeRemindManagementInput } from '../../src/logic/remind-notification-authorization';

describe('Remind Notification Authorization', () => {
  // SCEN-042
  test('should throw error when user has no access permission to remind notification management screen', () => {
    const input: AuthorizeRemindManagementInput = {
      userId: 'user-without-permission',
      requestContext: {
        authenticated: true,
        sessionId: 'session-123',
        permissions: [],
      },
    };

    expect(() => authorizeRemindManagement(input)).toThrow(/リマインド通知管理画面へのアクセス権限/);
  });
});