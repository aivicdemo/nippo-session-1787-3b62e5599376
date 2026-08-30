import { judgeAccessPermission } from '../../src/logic/access-control-and-permissions';
import type { AccessPermissionRequest } from '../../src/logic/access-control-and-permissions';

describe('朝会報告管理システム - アクセス制御と権限管理', () => {
  test('SCEN-380: ダッシュボード種別が空のときにエラーが投げられる', () => {
    const accessRequest: AccessPermissionRequest = {
      userId: 'user123',
      resourceType: 'dashboard',
      operation: 'view',
      targetTeamId: null,
      confidentialityLevel: null,
    };

    const requestedDashboardType = '';

    expect(() => {
      judgeAccessPermission(accessRequest, requestedDashboardType);
    }).toThrow(/ダッシュボード種別/);
  });
});