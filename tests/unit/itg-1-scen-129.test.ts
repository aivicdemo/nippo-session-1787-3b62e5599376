import { validateUserAuthorizationAndPermission } from '../../src/logic/auth-authorization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-129
  test('ユーザーID が null のとき、ユーザー役割判定がエラーを返す', () => {
    const input = {
      userId: null as any,
      requestedFeature: '日報入力',
      targetTeamId: 'team-001',
      targetDataType: '全チーム進捗',
    };

    expect(() => validateUserAuthorizationAndPermission(input)).toThrow(/ユーザーID/);
  });
});