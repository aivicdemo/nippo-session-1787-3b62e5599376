import { judgeAccessPermission } from '../../src/logic/access-control-and-permissions';

describe('朝会報告管理システム - アクセス制御と権限管理', () => {
  // SCEN-378: [normal] ユーザーの役割と要求されたリソース・操作に基づいて、アクセス可否を判定し、許可/拒否の結果を返す
  test('should permit dashboard view access for manager role with all_team data filter scope', () => {
    const userId = 'user-manager-001';
    const resourceType = 'dashboard' as const;
    const operation = 'view' as const;
    const targetTeamId = null;
    const confidentialityLevel = 'internal' as const;

    const result = judgeAccessPermission({
      userId,
      resourceType,
      operation,
      targetTeamId,
      confidentialityLevel,
    });

    // isPermitted should be true for manager accessing dashboard view operation
    expect(result.isPermitted).toBe(true);

    // userRole should be 'manager' for manager user
    expect(result.userRole).toBe('manager');

    // denialReason should be null when permission is granted
    expect(result.denialReason).toBeNull();

    // applicableDataFilters should contain all_team scope for manager accessing dashboards
    expect(result.applicableDataFilters).not.toBeNull();
    expect(result.applicableDataFilters?.visibleTeamIds.length).toBeGreaterThan(0);
    expect(result.applicableDataFilters?.viewOnlyMode).toBe(false);
  });
});