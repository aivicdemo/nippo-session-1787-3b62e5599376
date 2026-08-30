import { judgeAccessPermission } from '../../src/logic/access-control-and-permissions';
import type { AccessPermissionRequest, AccessPermissionResult } from '../../src/logic/access-control-and-permissions';

describe('Access Control and Permissions', () => {
  test('SCEN-273: Engineer user is denied view access to team reports due to insufficient role permission', () => {
    // Arrange
    const request: AccessPermissionRequest = {
      userId: 'engineer_001',
      resourceType: 'report',
      operation: 'view',
      targetTeamId: 'team_A',
      confidentialityLevel: undefined,
    };

    // Mock extractUserRoleFromContext to return engineer role
    const mockExtractUserRoleFromContext = jest.fn().mockReturnValue({
      userId: 'engineer_001',
      normalizedRole: 'engineer',
      roleHierarchyLevel: 1,
      teamId: 'team_A',
    });

    // Mock validateRoleHierarchy to pass validation
    const mockValidateRoleHierarchy = jest.fn().mockReturnValue({
      isValid: true,
      hierarchyLevel: 1,
    });

    // Mock mapRoleToPermissionSet to deny team_reports view for engineer
    const mockMapRoleToPermissionSet = jest.fn().mockReturnValue({
      role: 'engineer',
      allowedOperations: ['view'],
      editableFieldsByContext: {
        report_input: ['yesterday', 'today', 'issues'],
      },
      resourcePermissions: {
        own_report: { view: true, edit: true, delete: false, export: false },
        team_reports: { view: false, edit: false, delete: false, export: false },
        dashboard: { view: false, edit: false, delete: false, export: false },
        notification: { view: false, edit: false, delete: false, export: false },
      },
    });

    // Inject mocks into the function context
    const originalExtract = (global as any).extractUserRoleFromContext;
    const originalValidate = (global as any).validateRoleHierarchy;
    const originalMap = (global as any).mapRoleToPermissionSet;

    (global as any).extractUserRoleFromContext = mockExtractUserRoleFromContext;
    (global as any).validateRoleHierarchy = mockValidateRoleHierarchy;
    (global as any).mapRoleToPermissionSet = mockMapRoleToPermissionSet;

    try {
      // Act
      const result: AccessPermissionResult = judgeAccessPermission(request);

      // Assert
      expect(result.isPermitted).toBe(false);
      expect(result.userRole).toBe('engineer');
      expect(result.denialReason).toBe('この操作を実行する権限がありません');
      expect(result.applicableDataFilters).toBeNull();
    } finally {
      // Cleanup
      (global as any).extractUserRoleFromContext = originalExtract;
      (global as any).validateRoleHierarchy = originalValidate;
      (global as any).mapRoleToPermissionSet = originalMap;
    }
  });
});