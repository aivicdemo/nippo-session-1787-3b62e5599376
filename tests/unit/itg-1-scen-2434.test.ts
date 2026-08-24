import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Audit Log Recording', () => {
  test('SCEN-2434: validateMonthlyReportApproval should throw error when finalizedAt is null', async () => {
    const reportId = 'monthly-report-2024-01-001';
    const approverUserId = 'user-dept-head-001';
    const approvalStatus = 'approved' as const;
    const finalizedAtValue = null;
    const processedAtValue = new Date('2024-01-31T15:30:00Z');

    const analysisResult = {
      reportId,
      approvalStatus,
      processedAt: processedAtValue,
      nextAction: 'proceed_to_management_report' as const,
      finalizedAt: finalizedAtValue,
    };

    const auditLogBefore = {
      recordCount: 0,
    };

    expect(() => {
      validateMonthlyReportApproval(analysisResult, approverUserId);
    }).toThrow(/確定日時|finalizedAt|required/i);
  });
});