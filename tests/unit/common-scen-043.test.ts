import { authorizeRemindManagement } from '../../src/logic/remind-notification-authorization';

describe('RemindNotificationAuthorization', () => {
  // SCEN-043
  test('should throw error with invalid user message when user ID is invalid or does not exist', () => {
    const invalidUserInput = {
      userId: '',
      requestContext: {
        sessionId: 'session-001',
        authenticatedAt: '2024-01-15T10:00:00Z',
      },
    };

    expect(() => authorizeRemindManagement(invalidUserInput)).toThrow(/ユーザー情報が無効です。/);
  });
});