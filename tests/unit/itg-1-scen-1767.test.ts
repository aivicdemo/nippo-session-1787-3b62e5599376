import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Data Extraction', () => {
  // SCEN-1767
  test('should throw error when extraction start date has invalid format', () => {
    const invalidInput = {
      extractionPeriodStart: '2024-13-45 25:99:99',
      extractionPeriodEnd: '2024-12-31T23:59:59Z',
      requestedByUserId: 'user-001',
      teamIdFilter: ['team-001'],
    };

    expect(() => extractMonthlyReportData(invalidInput)).toThrow(/抽出開始日時/);
  });
});