import { describe, it, expect, beforeEach } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('Dashboard Data Freshness Check - Team Information Null Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2772
  it('should throw error when manager dashboard data freshness check fails due to null team information', () => {
    const input = {
      userId: 'manager-001',
      teamId: null,
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
    };

    expect(() => {
      ensureDashboardDataFreshness(input);
    }).toThrow(/確認対象チーム/);
  });
});