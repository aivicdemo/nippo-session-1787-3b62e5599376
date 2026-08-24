import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';
import { type DashboardAccessControlInput, type DashboardAccessControlOutput } from '../../src/logic/manager-dashboard';

describe('ダッシュボード権限判定機能', () => {
  // SCEN-990
  test('ユーザーのログイン状態が不在のときエラーになる', () => {
    // 初期状態：セッションストレージおよびローカルストレージにユーザー認証トークンが存在しない
    sessionStorage.clear();
    localStorage.clear();

    // ダッシュボード権限判定ロジックに未認証状態でアクセスを試みる
    const input: DashboardAccessControlInput = {
      userId: '',
      userRole: 'manager',
      userTeamId: 'team-001',
      requestedAccessLevel: 'team_only',
    };

    // システムが認証トークンの不在を検出し、認証エラーをスロー
    expect(() => determineDashboardAccessControl(input)).toThrow(/ログイン/);
  });
});