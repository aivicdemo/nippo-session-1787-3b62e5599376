import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('manager-dashboard', () => {
  test('SCEN-2123: [error] ensureDashboardDataFreshness - throws when retention rules are empty', async () => {
    // Arrange
    const input = {
      userId: 'user-dept-head-001',
      teamId: 'team-engineering-001',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
    };

    const emptyRetentionRules: Array<{ dataType: string; retentionDays: number }> = [];

    // Act & Assert
    await expect(
      ensureDashboardDataFreshness(input, emptyRetentionRules)
    ).rejects.toThrow(/保持ルール/);
  });
});