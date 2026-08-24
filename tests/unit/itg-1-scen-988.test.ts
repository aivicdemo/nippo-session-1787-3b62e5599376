import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';

describe('部長向けダッシュボードアクセス制御', () => {
  test('SCEN-988: 部長権限なしユーザーが全チーム進捗データへのアクセスを試みたときエラーになる', () => {
    const input = {
      userId: 'U002',
      userRole: 'engineer',
      userTeamId: 'T001',
      requestedAccessLevel: 'full' as const,
    };

    expect(() => determineDashboardAccessControl(input)).toThrow(/権限/);
  });
});