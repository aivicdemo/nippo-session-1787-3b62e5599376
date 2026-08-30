import { judgeAccessPermission } from '../../src/logic/access-control-and-permissions';
import { type AccessPermissionRequest, type AccessPermissionResult } from '../../src/logic/access-control-and-permissions';

describe('朝会報告管理システム - アクセス制御・権限管理', () => {
  test('SCEN-563: セキュリティポリシーが未設定のときデフォルトルールを適用して全社レベルのリソースへのアクセスを許可する', () => {
    const userAuthContext = {
      userId: 'user-001',
      userName: 'manager-user',
      roleAttribute: 'manager',
      teamId: undefined,
      departmentId: undefined,
      authenticationTimestamp: Math.floor(Date.now() / 1000),
    };

    const accessRequest: AccessPermissionRequest = {
      userId: 'user-001',
      resourceType: 'analysis_report',
      operation: 'view',
      targetTeamId: null,
      confidentialityLevel: null,
    };

    const mockConfidentialityPolicy = null;

    const result: AccessPermissionResult = judgeAccessPermission(
      userAuthContext,
      accessRequest,
      mockConfidentialityPolicy
    );

    expect(result.isPermitted).toBe(true);
    expect(result.userRole).toBe('manager');
    expect(result.denialReason).toBeNull();
    expect(result.applicableDataFilters).toBeDefined();
    expect(result.applicableDataFilters?.visibleTeamIds).toEqual([]);
    expect(result.applicableDataFilters?.viewOnlyMode).toBe(false);
  });
});