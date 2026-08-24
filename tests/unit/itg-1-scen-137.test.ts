import { validateUserAuthorizationAndPermission } from '../../src/logic/auth-authorization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-137
  test('[error] ユーザー役割による機能アクセス制御 - システム稼働状態フラグが null のとき、アクセス制御ロジックがエラーを返す', () => {
    const input: Parameters<typeof validateUserAuthorizationAndPermission>[0] = {
      userId: 'user-001',
      requestedFeature: 'dashboard_view',
      targetTeamId: 'team-001',
      targetDataType: 'all_teams',
      systemStatusFlag: null,
    };

    expect(() => validateUserAuthorizationAndPermission(input)).toThrow(/システム稼働状態フラグ/);
  });
});