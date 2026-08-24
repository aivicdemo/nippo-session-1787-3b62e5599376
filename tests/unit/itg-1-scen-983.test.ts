import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-983
  test('ユーザーIDが空文字列のときエラーになる', () => {
    const invalidInput = {
      userId: '',
      userRole: 'manager' as const,
      userTeamId: 'team-001',
      requestedAccessLevel: 'team_only' as const,
    };

    expect(() => determineDashboardAccessControl(invalidInput)).toThrow(/ユーザーID/);
  });
});