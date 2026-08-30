import { judgeAccessPermission } from '../../src/logic/access-control-and-permissions';

describe('Access Control and Permissions', () => {
  test('SCEN-130: Should deny access when resource confidentiality level exceeds user permission level', () => {
    // Setup: User context with engineer role
    const userContext = {
      userId: 'user-001',
      assignedRole: 'engineer',
      teamIds: ['team-001'],
    };

    // Setup: Access permission request with executive_only confidentiality
    const request = {
      userId: 'user-001',
      resourceType: 'report' as const,
      operation: 'view' as const,
      targetTeamId: null,
      confidentialityLevel: 'executive_only' as const,
    };

    // Execute: Call judgeAccessPermission
    // Engineer role can only access up to 'internal' level
    // Request is for 'executive_only' level, which exceeds engineer's permission
    const result = judgeAccessPermission(userContext, request);

    // Verify: Access should be denied
    expect(result.isPermitted).toBe(false);

    // Verify: userRole should reflect engineer role
    expect(result.userRole).toBe('engineer');

    // Verify: Denial reason should explicitly mention confidentiality level restriction
    expect(result.denialReason).toBeDefined();
    expect(result.denialReason).toMatch(/機密レベル|閲覧権限/);
    expect(result.denialReason).toBe('この資料の機密レベルが高く、閲覧権限がありません。');

    // Verify: No data filters should be provided when access is denied
    expect(result.applicableDataFilters).toBeNull();
  });
});