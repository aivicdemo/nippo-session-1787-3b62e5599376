import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';
import type {
  DashboardDataFreshnessInput,
  DashboardDataFreshnessOutput,
} from '../../src/logic/manager-dashboard';

describe('manager-dashboard: ensureDashboardDataFreshness', () => {
  // SCEN-2771
  test('should deny access when user role is not manager', () => {
    const input: DashboardDataFreshnessInput = {
      userId: 'user-001',
      teamId: 'team-001',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
    };

    const mockUserContext = {
      userId: 'user-001',
      userRole: 'engineer',
      teamId: 'team-001',
    };

    expect(() =>
      ensureDashboardDataFreshness(input, mockUserContext)
    ).toThrow(/権限/);
  });
});