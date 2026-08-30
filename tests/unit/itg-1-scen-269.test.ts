import { judgeAccessPermission } from '../../src/logic/access-control-and-permissions';

describe('Access Control and Permissions', () => {
  test('SCEN-269: Engineer can view own report with self-team data filter', () => {
    // Arrange
    const userId = 'eng001';
    const userRole = 'engineer';
    const requestedAction = 'view';
    const targetResourceType = 'report';
    const targetTeamId = null;
    const confidentialityLevel = 'public';

    // Act
    const result = judgeAccessPermission(
      userId,
      userRole,
      requestedAction,
      targetResourceType,
      targetTeamId,
      confidentialityLevel
    );

    // Assert
    expect(result.isPermitted).toBe(true);
    expect(result.userRole).toBe('engineer');
    expect(result.denialReason).toBe(null);
    expect(result.applicableDataFilters).not.toBeNull();
    expect(result.applicableDataFilters?.visibleTeamIds).toContain('eng001');
    expect(result.applicableDataFilters?.viewOnlyMode).toBe(true);
  });
});