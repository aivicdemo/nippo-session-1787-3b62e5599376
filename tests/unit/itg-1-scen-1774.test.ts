import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - extractMonthlyReportData', () => {
  // SCEN-1774
  test('should throw error with TRIGGER_VERIFICATION_FAILED when triggerVerificationFlag is false', () => {
    const input = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'user-001',
      triggerVerificationFlag: false,
    };

    expect(() => extractMonthlyReportData(input)).toThrow(/トリガー確認/);
  });
});