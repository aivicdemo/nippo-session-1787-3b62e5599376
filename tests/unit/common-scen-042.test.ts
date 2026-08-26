import { authorizeRemindManagement, type AuthorizeRemindManagementInput } from '../../src/logic/remind-notification-authorization';

describe('共通', () => {
  // SCEN-042
  test('ユーザーがリマインド通知管理画面へのアクセス権限を持たない場合、エラーを throw する', () => {
    const input: AuthorizeRemindManagementInput = {
      userId: 'user-without-permission',
      requestContext: {
        authenticated: true,
        sessionId: 'session-123',
      },
    };

    expect(() => authorizeRemindManagement(input)).toThrow(/リマインド通知管理画面へのアクセス権限がありません。/);
  });
});