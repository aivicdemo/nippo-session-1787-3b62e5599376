import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Extract Monthly Report Data', () => {
  // SCEN-1769
  test('should throw error when extraction start date is after extraction end date', () => {
    const extractionStartDate = new Date('2024-01-15T10:00:00Z');
    const extractionEndDate = new Date('2024-01-15T09:00:00Z');
    const requestedByUserId = 'user-001';

    expect(() =>
      extractMonthlyReportData({
        extractionStartDate,
        extractionEndDate,
        requestedByUserId,
      })
    ).toThrow(/抽出開始日時/);
  });
});