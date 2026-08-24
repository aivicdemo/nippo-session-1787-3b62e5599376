import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ensureDashboardDataFreshness', () => {
  // SCEN-2120
  test('should return error with INVALID_CURRENT_DATETIME code and message when current date is null', async () => {
    const input = {
      userId: 'manager-001',
      teamId: 'team-123',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
    };

    const mockCurrentDatetime = null;

    const result = await ensureDashboardDataFreshness(input, mockCurrentDatetime);

    expect(result).toEqual({
      isDataFresh: false,
      errorCode: 'INVALID_CURRENT_DATETIME',
      errorMessage: '現在日時が取得できません',
      lastUpdateTimestamp: undefined,
      displayTimestamp: undefined,
      stalenessSeconds: undefined,
    });
    
    expect(result.errorCode).toBe('INVALID_CURRENT_DATETIME');
    expect(result.errorMessage).toBe('現在日時が取得できません');
  });
});