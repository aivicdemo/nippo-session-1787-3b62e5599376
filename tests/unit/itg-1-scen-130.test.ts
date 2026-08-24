import { validateUserAuthorizationAndPermission } from '../../src/logic/auth-authorization';

describe('ユーザー役割による機能アクセス制御', () => {
  test('SCEN-130: ユーザーID が空文字列のとき、ユーザー役割判定がエラーを返す', () => {
    const input = {
      userId: '',
      requestedFeature: '日報入力',
      targetTeamId: 'team-001',
      targetDataType: '全チーム進捗',
    };

    expect(() => validateUserAuthorizationAndPermission(input)).toThrow(/ユーザーID/);
  });
});