import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';

describe('ダッシュボード権限判定機能', () => {
  // SCEN-987
  test('ユーザーが所属していないチームへのアクセスを試みたときエラーになる', () => {
    const user_context: Parameters<typeof determineDashboardAccessControl>[0] = {
      userId: 'user-A',
      userRole: 'manager',
      teamId: 'team-X'
    };

    const access_control_input: Parameters<typeof determineDashboardAccessControl>[1] = {
      userId: 'user-A',
      userRole: 'manager',
      userTeamId: 'team-X',
      requestedAccessLevel: 'team_only'
    };

    const requested_team_id = 'team-Y';

    expect(() => {
      determineDashboardAccessControl(user_context, access_control_input, requested_team_id);
    }).toThrow(/チームへのアクセス権/);
  });
});