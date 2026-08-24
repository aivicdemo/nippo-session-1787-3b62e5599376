import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('Manager Dashboard Data Freshness', () => {
  // SCEN-1082: [edge] ダッシュボード更新機能 - ダッシュボード表示時刻がシステム時刻とちょうど一致する
  test('should return displayTimestamp matching system time exactly when called', () => {
    const fixedSystemTime = '2026-08-19T10:30:00.000Z';
    const fixedDate = new Date(fixedSystemTime);

    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);

    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      reportDate: '2026-08-19',
      maxStalenessSeconds: 300,
    };

    const result = ensureDashboardDataFreshness(input);

    expect(result.displayTimestamp).toBe(fixedSystemTime);
    expect(result.displayTimestamp).toEqual(fixedSystemTime);

    jest.useRealTimers();
  });
});