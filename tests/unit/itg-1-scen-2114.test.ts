import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';
import type { DashboardDataFreshnessInput, DashboardDataFreshnessOutput } from '../../src/logic/manager-dashboard';

describe('Dashboard Data Freshness Management', () => {
  // SCEN-2114
  test('should complete successfully when no data deletion targets exist', async () => {
    const startTime = new Date('2024-01-15T09:30:00Z');
    const currentTime = new Date('2024-01-15T09:35:00Z');
    
    const input: DashboardDataFreshnessInput = {
      userId: 'user-dept-head-001',
      teamId: 'team-dev-001',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
    };

    const mockCurrentTime = currentTime.getTime();
    const mockLastUpdateTime = startTime.getTime();
    const expectedStalenessSeconds = Math.floor((mockCurrentTime - mockLastUpdateTime) / 1000);

    const result: DashboardDataFreshnessOutput = await ensureDashboardDataFreshness(input);

    expect(result).toEqual({
      isDataFresh: true,
      lastUpdateTimestamp: startTime.toISOString(),
      displayTimestamp: currentTime.toISOString(),
      stalenessSeconds: expectedStalenessSeconds,
    });

    expect(result.isDataFresh).toBe(true);
    expect(result.stalenessSeconds).toBeLessThanOrEqual(300);
    expect(result.stalenessSeconds).toBe(expectedStalenessSeconds);
    expect(result.lastUpdateTimestamp).toBe(startTime.toISOString());
    expect(result.displayTimestamp).toBe(currentTime.toISOString());
  });
});