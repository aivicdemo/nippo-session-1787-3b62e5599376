import { authorizeRemindManagement, type AuthorizeRemindManagementInput, type AuthorizeRemindManagementOutput } from '../../src/logic/remind-notification-authorization';

describe('共通', () => {
  // SCEN-041
  test('ユーザーのリマインド通知管理画面へのアクセス権限を検証し、権限の有無を返す', () => {
    const input: AuthorizeRemindManagementInput = {
      userId: 'user-001',
      requestContext: {
        sessionId: 'session-abc123',
        authenticatedAt: '2024-01-15T11:00:00Z',
      },
    };

    const result: AuthorizeRemindManagementOutput = authorizeRemindManagement(input);

    expect(result.authorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(typeof result.grantedAt).toBe('string');
  });
});