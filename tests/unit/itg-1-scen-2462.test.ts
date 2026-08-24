import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-2462: [edge] 分析結果監査ログ記録機能 - データ範囲が30日間直上（31日間）で記録される
  test('should record audit log with time_range_days of 31 for monthly report approval validation', () => {
    const referenceTimestamp = new Date('2026-08-19T10:00:00Z');

    const monthlyReportApprovalInput = {
      reportId: 'report-2026-08-19-001',
      approvalStatus: 'approved' as const,
      approverUserId: 'user-dept-head-001',
    };

    const auditLogResult = validateMonthlyReportApproval(
      monthlyReportApprovalInput,
      referenceTimestamp
    );

    expect(auditLogResult).toBeDefined();
    expect(auditLogResult.reportId).toBe('report-2026-08-19-001');
    expect(auditLogResult.approvalStatus).toBe('approved');
    expect(auditLogResult.processedAt).toEqual(referenceTimestamp);
    expect(auditLogResult.auditLog).toBeDefined();
    expect(auditLogResult.auditLog.time_range_days).toBe(31);

    const secondReferenceTimestamp = new Date('2026-09-19T10:00:00Z');
    const secondAuditLogResult = validateMonthlyReportApproval(
      {
        reportId: 'report-2026-09-19-001',
        approvalStatus: 'approved' as const,
        approverUserId: 'user-dept-head-002',
      },
      secondReferenceTimestamp
    );

    expect(secondAuditLogResult.auditLog.time_range_days).toBe(31);

    const rejectionAuditLogResult = validateMonthlyReportApproval(
      {
        reportId: 'report-2026-10-19-001',
        approvalStatus: 'rejected' as const,
        rejectionReason: '品質基準を満たしていません',
        approverUserId: 'user-dept-head-003',
      },
      new Date('2026-10-19T10:00:00Z')
    );

    expect(rejectionAuditLogResult.auditLog.time_range_days).toBe(31);
  });
});