import { authorizeRemindManagement, type AuthorizeRemindManagementInput, type AuthorizeRemindManagementOutput } from '../../src/logic/remind-notification-authorization';

describe('authorizeRemindManagement', () => {
  // SCEN-043
  test('should throw error with invalid user ID message when user information is invalid', async () => {
    const invalidInput: AuthorizeRemindManagementInput = {
      userId: 'non-existent-user-id',
      requestContext: {
        sessionId: 'test-session-123',
        authenticatedAt: '2024-01-15T11:00:00Z'
      }
    };

    expect(() => authorizeRemindManagement(invalidInput)).toThrow(/ユーザー情報が無効です/);
  });
});