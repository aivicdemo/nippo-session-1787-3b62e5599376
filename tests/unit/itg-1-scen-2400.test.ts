import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - extractMonthlyReportData', () => {
  // SCEN-2400
  test('should throw error when start date and end date are the same', () => {
    const sameDate = '2026-08-19';

    expect(() =>
      extractMonthlyReportData({
        targetYear: 2026,
        targetMonth: 8,
        requestedByUserId: 'user-001',
        aggregationStartDate: sameDate,
        aggregationEndDate: sameDate,
      })
    ).toThrow(/開始日と終了日に同じ日付/);
  });
});