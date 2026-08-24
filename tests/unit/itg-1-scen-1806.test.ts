import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Extract Monthly Report Data', () => {
  test('SCEN-1806: should throw validation error when targetYear is empty string', () => {
    const invalidInput = {
      targetYear: '' as any,
      targetMonth: 1,
      requestedByUserId: 'user-123',
    };

    expect(() => extractMonthlyReportData(invalidInput)).toThrow(/対象年月|YYYY-MM/);
  });
});