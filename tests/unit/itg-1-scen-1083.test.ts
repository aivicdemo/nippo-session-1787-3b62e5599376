import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';
import type { DashboardDataFreshnessInput, DashboardDataFreshnessOutput } from '../../src/logic/manager-dashboard';

describe('Manager Dashboard Data Freshness', () => {
  // SCEN-1083: [edge] ダッシュボード更新機能 - ダッシュボード表示時刻がシステム時刻の1秒未満時点で記録される
  test('should record dashboard display timestamp with sub-second precision', () => {
    // Fixed system time: 2026-08-19T10:30:45.999Z
    const fixedNowMs = new Date('2026-08-19T10:30:45.999Z').getTime();
    const initialTimestamp = new Date(fixedNowMs);

    // User context
    const userId = 'user-manager-001';
    const teamId = 'team-dev-001';
    const reportDate = '2026-08-19';

    // Expected timestamp after 0.5 seconds: 2026-08-19T10:30:46.499Z
    const expectedDisplayTimestampMs = fixedNowMs + 500; // +0.5 seconds
    const expectedDisplayTimestamp = new Date(expectedDisplayTimestampMs).toISOString();

    // Input for ensuring data freshness
    const input: DashboardDataFreshnessInput = {
      userId,
      teamId,
      reportDate,
      maxStalenessSeconds: 300, // Default 5 minutes tolerance
    };

    // Mock current time to simulate the 0.5-second advance
    const mockDateNow = jest.spyOn(Date, 'now');
    mockDateNow.mockReturnValue(expectedDisplayTimestampMs);

    try {
      // Call the function to record display timestamp
      const result: DashboardDataFreshnessOutput = ensureDashboardDataFreshness(input);

      // Assertions: verify the recorded timestamp has sub-second precision
      expect(result.isDataFresh).toBe(true);
      expect(result.displayTimestamp).toBe(expectedDisplayTimestamp);

      // Parse timestamps to verify precision at millisecond level
      const displayTime = new Date(result.displayTimestamp).getTime();
      const lastUpdateTime = new Date(result.lastUpdateTimestamp).getTime();

      // Verify display timestamp matches expected value with millisecond precision
      expect(displayTime).toBe(expectedDisplayTimestampMs);

      // Verify staleness calculation (should be within maxStalenessSeconds)
      const stalenessMs = displayTime - lastUpdateTime;
      const stalenessSeconds = Math.floor(stalenessMs / 1000);
      expect(stalenessSeconds).toBeLessThanOrEqual(300);
      expect(result.stalenessSeconds).toBe(stalenessSeconds);

      // Verify the timestamp precision matches the ISO 8601 format with milliseconds
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(result.displayTimestamp).toMatch(isoRegex);

    } finally {
      mockDateNow.mockRestore();
    }
  });
});