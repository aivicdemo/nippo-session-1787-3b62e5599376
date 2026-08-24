import { validateUserAuthorizationAndPermission } from '../../src/logic/auth-authorization';

describe('ユーザー役割による機能アクセス制御', () => {
  // SCEN-132
  test('ログイン状態フラグが null のとき、アクセス制御ロジックがエラーを返す', () => {
    const input = {
      userId: 'user-001',
      requestedFeature: '日報入力',
      targetTeamId: 'team-001',
      targetDataType: '全チーム進捗',
    };

    const authContext = {
      userId: 'user-001',
      role: 'reporter',
      teamIds: ['team-001'],
      isActive: null as any,
    };

    const result = validateUserAuthorizationAndPermission(input, authContext);

    expect(result.isAuthorized).toBe(false);
    expect(result.userRole).toBe('reporter');
    expect(result.allowedDataScope).toBe('none');
    expect(result.editableFeatures).toEqual([]);
  });
});