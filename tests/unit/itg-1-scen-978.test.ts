import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';

describe('ダッシュボード権限判定機能', () => {
  // SCEN-978
  test('[error] ユーザーの職務権限が null のときエラーになる', () => {
    const userContext = {
      userId: 'user-001',
      userRole: null,
      teamId: 'team-001',
    };

    expect(() =>
      determineDashboardAccessControl({
        userId: userContext.userId,
        userRole: userContext.userRole as any,
        userTeamId: userContext.teamId,
        requestedAccessLevel: 'team_only',
      })
    ).toThrow(/職務権限/);
  });
});