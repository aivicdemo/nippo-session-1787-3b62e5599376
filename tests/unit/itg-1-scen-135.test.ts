import { validateUserAuthorizationAndPermission } from '../../src/logic/auth-authorization';

describe('User Role-Based Access Control', () => {
  test('SCEN-135: Manager role is denied access to daily report input form', () => {
    // Arrange
    const authContext = {
      userId: 'user-manager-001',
      role: 'manager',
      teamIds: ['team-001'],
      isActive: true,
    };

    const authorizationCheckInput = {
      userId: 'user-manager-001',
      requestedFeature: '日報入力',
      targetTeamId: 'team-001',
      targetDataType: '自分の進捗のみ',
    };

    // Act
    const result = validateUserAuthorizationAndPermission(
      authContext,
      authorizationCheckInput,
    );

    // Assert
    expect(result.isAuthorized).toBe(false);
    expect(result.userRole).toBe('manager');
    expect(result.allowedDataScope).toBe('自チームのみ');
    expect(result.editableFeatures).toEqual([]);
  });
});