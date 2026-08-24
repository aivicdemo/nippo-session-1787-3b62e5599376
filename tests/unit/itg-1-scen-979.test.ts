import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';

describe('ダッシュボード権限判定機能', () => {
  // SCEN-979
  test('職務権限が空文字列のときエラーになる', () => {
    const input = {
      userId: 'user-001',
      userRole: '',
      userTeamId: 'team-001',
      requestedAccessLevel: 'team_only' as const,
    };

    expect(() => determineDashboardAccessControl(input)).toThrow(/職務権限/);
  });
});