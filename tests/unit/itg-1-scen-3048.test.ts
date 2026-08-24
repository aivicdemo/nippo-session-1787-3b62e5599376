import { describe, test, expect } from '@jest/globals';
import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';
import type {
  DashboardAccessControlInput,
  DashboardAccessControlOutput,
} from '../../src/logic/manager-dashboard';

describe('Manager Dashboard Access Control - Team Structure Null Handling', () => {
  // SCEN-3048
  test('should throw error when team structure is null during submission status aggregation', () => {
    const input: DashboardAccessControlInput = {
      userId: 'manager-001',
      userRole: 'manager',
      userTeamId: 'team-alpha',
      requestedAccessLevel: 'team_only',
    };

    expect(() => {
      determineDashboardAccessControl(input);
    }).toThrow(/team structure/i);
  });
});