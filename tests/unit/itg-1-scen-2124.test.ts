import { describe, test, expect } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';
import type { DashboardDataFreshnessInput, DashboardDataFreshnessOutput } from '../../src/logic/manager-dashboard';

describe('ensureDashboardDataFreshness', () => {
  // SCEN-2124
  test('should throw error when retention period is negative', () => {
    const input: DashboardDataFreshnessInput = {
      userId: 'user-001',
      teamId: 'team-001',
      reportDate: '2024-01-15',
      maxStalenessSeconds: -30,
    };

    expect(() => ensureDashboardDataFreshness(input)).toThrow(/保持期間/);
  });
});