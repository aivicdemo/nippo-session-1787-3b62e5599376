import { validateUserAuthorizationAndPermission } from '../../src/logic/auth-authorization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-127
  test('[error] ユーザー役割による機能アクセス制御 - ユーザー役割が null のとき、アクセス制御ロジックがエラーを返す', () => {
    const nullRoleUser: {
      userId: string;
      role: null;
      teamIds: string[];
      isActive: boolean;
    } = {
      userId: 'user-001',
      role: null,
      teamIds: ['team-001'],
      isActive: true,
    };

    const result = validateUserAuthorizationAndPermission(nullRoleUser);

    expect(result.isAuthorized).toBe(false);
    expect(result.errorCode).toBe('ERR_INVALID_ROLE');
    expect(result.errorMessage).toBe(
      'ユーザー役割が指定されていません。アクセスを拒否します。'
    );
  });
});