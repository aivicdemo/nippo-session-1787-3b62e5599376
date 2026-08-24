import { describe, test, expect } from '@jest/globals';
import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('fetchYesterdayReport', () => {
  // SCEN-2683
  test('should return error with INVALID_DATE_FORMAT when targetDate is empty string', async () => {
    const engineerId = 'ENG001';
    const targetDate = '';
    const requestingUserId = 'USER001';

    const result = await fetchYesterdayReport(
      engineerId,
      targetDate,
      requestingUserId
    );

    expect(result).toBeDefined();
    expect(result.errorCode).toBe('INVALID_DATE_FORMAT');
    expect(result.errorMessage).toMatch(/報告日付が入力されていません/);
    expect(result.data).toBeUndefined();
  });
});