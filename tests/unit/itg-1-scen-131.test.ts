import { validateUserAuthorizationAndPermission } from '../../src/logic/auth-authorization';

describe('ユーザー認証・権限管理 - ログイン状態フラグによるアクセス制御', () => {
  test('SCEN-131: ユーザー役割による機能アクセス制御 - ログイン状態フラグが false のとき、アクセス制御がエラーを返す', () => {
    const user_auth_context = {
      userId: 'user-001',
      role: 'engineer',
      teamIds: ['team-A'],
      isActive: true,
    };

    const authorization_check_input = {
      userId: user_auth_context.userId,
      requestedFeature: '日報入力',
      targetTeamId: 'team-A',
      targetDataType: '自分の進捗のみ',
    };

    const user_context_with_logged_out = {
      ...user_auth_context,
      isActive: false,
    };

    const result = validateUserAuthorizationAndPermission(
      user_context_with_logged_out,
      authorization_check_input,
    );

    expect(result.isAuthorized).toBe(false);
    expect(result.errorCode).toBe('UNAUTHORIZED');
    expect(result.errorMessage).toBe(
      'ログインが必要です。再度ログインしてください。',
    );
    expect(result.statusCode).toBe(401);
    expect(result.allowedDataScope).toBeNull();
    expect(result.editableFeatures).toEqual([]);
  });
});