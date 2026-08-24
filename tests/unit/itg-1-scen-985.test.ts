import { describe, test, expect } from '@jest/globals';
import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';

describe('Manager Dashboard Access Control', () => {
  test('SCEN-985: throws error when teamId is empty string', () => {
    const input = {
      userId: 'user-001',
      userRole: 'manager' as const,
      userTeamId: 'team-001',
      requestedAccessLevel: 'team_only' as const,
    };

    const invalidInput = {
      ...input,
      userTeamId: '',
    };

    expect(() => determineDashboardAccessControl(invalidInput)).toThrow(/チームID/);
  });
});