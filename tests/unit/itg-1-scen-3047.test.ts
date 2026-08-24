import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';
import { type DashboardAccessControlInput, type DashboardAccessControlOutput } from '../../src/logic/manager-dashboard';

describe('部長向けダッシュボード提出状況集計機能 - アクセス制御', () => {
  // SCEN-3047
  test('権限レベルが定義範囲外のとき、フィルター設定が不正になりエラーになる', () => {
    const invalidAccessControlInput: DashboardAccessControlInput = {
      userId: 'user-dept-head-001',
      userRole: 'manager',
      userTeamId: 'team-001',
      requestedAccessLevel: 'full',
    };

    const invalidUserContext = {
      userId: 'user-dept-head-001',
      userRole: 'manager',
      teamId: 'team-001',
      authorizationLevel: 999,
    };

    expect(() => {
      determineDashboardAccessControl(invalidAccessControlInput, invalidUserContext);
    }).toThrow(/権限レベル/);
  });
});