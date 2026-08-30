import { judgeAccessPermission } from '../../src/logic/access-control-and-permissions';
import { type AccessPermissionResult, type DataFilterSet } from '../../src/logic/access-control-and-permissions';

describe('Access Control and Permissions - judgeAccessPermission', () => {
  test('SCEN-517: [normal] judgeAccessPermissionが設計された計算式の代表値を返す', () => {
    // Arrange
    const userId = 'user-001';
    const resourceType = 'report';
    const operation = 'view';
    const targetTeamId = 'team-A';
    const confidentialityLevel = 'internal';

    const input: AccessPermissionRequest = {
      userId,
      resourceType,
      operation,
      targetTeamId,
      confidentialityLevel
    };

    // Act
    const result: AccessPermissionResult = judgeAccessPermission(input);

    // Assert
    // isPermittedフィールドの確認
    expect(result.isPermitted).toBe(true);

    // userRoleフィールドの確認
    expect(result.userRole).toBe('manager');

    // denialReasonフィールドの確認
    expect(result.denialReason).toBeNull();

    // applicableDataFiltersフィールドの確認 - DataFilterSet型のオブジェクトが返されることを確認
    expect(result.applicableDataFilters).toBeDefined();
    expect(result.applicableDataFilters).not.toBeNull();

    if (result.applicableDataFilters !== null && result.applicableDataFilters !== undefined) {
      // 同一チームのデータフィルターが適用されていることを確認
      expect(result.applicableDataFilters.visibleTeamIds).toContain('team-A');
      expect(result.applicableDataFilters.viewOnlyMode).toBe(false);
    }
  });
});