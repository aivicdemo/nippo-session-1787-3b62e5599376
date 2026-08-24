import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';
import type { MonthlyReportApprovalInput, MonthlyReportApprovalResult } from '../../src/logic/monthly-performance-analysis';

describe('validateMonthlyReportApproval - Analysis Audit Log Recording', () => {
  let originalNow: () => number;

  beforeEach(() => {
    originalNow = Date.now;
    const fixedTimestamp = new Date('2026-01-15T09:00:00Z').getTime();
    Date.now = jest.fn(() => fixedTimestamp);
  });

  afterEach(() => {
    Date.now = originalNow;
  });

  // SCEN-2457
  test('should record analysis result audit log with confirmed timestamp exactly at business day start time (09:00:00)', () => {
    const testReportId = 'report_20260115_001';
    const testApproverId = 'user_director_001';
    
    const input: MonthlyReportApprovalInput = {
      reportId: testReportId,
      approvalStatus: 'approved',
      approverUserId: testApproverId,
    };

    const result: MonthlyReportApprovalResult = validateMonthlyReportApproval(input);

    expect(result.reportId).toBe(testReportId);
    expect(result.approvalStatus).toBe('approved');
    expect(result.processedAt).toEqual(new Date('2026-01-15T09:00:00Z'));
    expect(result.nextAction).toBe('proceed_to_management_report');
    
    const expectedConfirmedTimestamp = '2026-01-15T09:00:00Z';
    expect(result.processedAt.toISOString()).toBe(expectedConfirmedTimestamp);
  });
});