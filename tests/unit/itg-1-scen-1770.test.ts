import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Data Extraction', () => {
  test('SCEN-1770: extractMonthlyReportData throws error when extraction start datetime does not match first day of previous month at 00:00', () => {
    const targetYear = 2026;
    const targetMonth = 9;
    const requestedByUserId = 'user-001';

    const input = {
      targetYear,
      targetMonth,
      requestedByUserId,
    };

    const mockInvalidStartDatetime = new Date('2026-08-01T09:30:00Z');

    expect(() => {
      extractMonthlyReportData(input, mockInvalidStartDatetime);
    }).toThrow(/INVALID_EXTRACTION_START_DATETIME/);
  });
});