import { describe, test, expect } from '@jest/globals';
import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';

describe('determineDashboardAccessControl - Invalid Role Error Handling', () => {
  test('SCEN-986: throws error when undefined role value is passed', () => {
    // Input with undefined role value
    const invalidInputWithStringRole = {
      userId: 'user-123',
      userRole: 'UNDEFINED_ROLE' as any,
      userTeamId: 'team-456',
      requestedAccessLevel: 'team_only' as const,
    };

    // Should throw error for undefined role
    expect(() =>
      determineDashboardAccessControl(invalidInputWithStringRole),
    ).toThrow(/role|権限|ロール/i);
  });
});