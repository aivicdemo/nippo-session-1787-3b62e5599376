import { validateUserAuthorizationAndPermission } from '../../src/logic/auth-authorization';

describe('ユーザー役割による機能アクセス制御', () => {
  // SCEN-128
  test('ユーザー役割が空文字列のとき、アクセス制御ロジックがエラーを返す', () => {
    const input: AuthorizationCheckInput = {
      userId: 'user-001',
      requestedFeature: '日報入力',
      targetTeamId: 'team-001',
      targetDataType: '自分の進捗のみ',
    };

    const emptyRoleContext: UserAuthContext = {
      userId: 'user-001',
      role: '',
      teamIds: ['team-001'],
      isActive: true,
    };

    expect(() => {
      validateUserAuthorizationAndPermission(input, emptyRoleContext);
    }).toThrow(/役割/);
  });
});