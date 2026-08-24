import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import { type MonthlyReportDataset, type ExtractionValidationResult } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Extract Monthly Report Data', () => {
  // SCEN-2407
  test('should throw error when archive retention period is less than 1 year (11 months)', () => {
    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = 'user-001';
    const archiveRetentionMonths = 11;

    const input = {
      targetYear,
      targetMonth,
      requestedByUserId,
      archiveRetentionPeriodMonths: archiveRetentionMonths,
    };

    expect(() => extractMonthlyReportData(input)).toThrow(/アーカイブ保持期限/);
  });
});