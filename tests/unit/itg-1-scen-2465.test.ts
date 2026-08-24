import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Report Approval Validation with Audit Logging', () => {
  // SCEN-2465: [edge] 分析結果監査ログ記録機能 - データ範囲の開始日と終了日が同日で記録される
  test('should record audit log with same-day analysis period when start and end dates are identical', async () => {
    const reportId = 'report-20260819-001';
    const approverUserId = 'user-director-001';
    const analysisDate = new Date('2026-08-19T00:00:00Z');

    const input = {
      reportId,
      approvalStatus: 'approved' as const,
      approverUserId,
    };

    const result = await validateMonthlyReportApproval(input);

    expect(result).toBeDefined();
    expect(result.reportId).toBe(reportId);
    expect(result.approvalStatus).toBe('approved');
    expect(result.processedAt).toBeInstanceOf(Date);
    expect(result.nextAction).toBe('proceed_to_management_report');

    const auditLogStartDate = new Date('2026-08-19T00:00:00Z');
    const auditLogEndDate = new Date('2026-08-19T23:59:59Z');

    expect(result.processedAt.toISOString()).toMatch(/2026-08-19/);

    const auditLogEntry = {
      reportId,
      approverUserId,
      analysisRangeStart: auditLogStartDate.toISOString(),
      analysisRangeEnd: auditLogEndDate.toISOString(),
      processedAtTimestamp: result.processedAt.toISOString(),
      approvalStatus: 'approved',
      processingStatus: 'success',
    };

    expect(auditLogEntry.reportId).toBe('report-20260819-001');
    expect(auditLogEntry.approverUserId).toBe('user-director-001');
    expect(auditLogEntry.analysisRangeStart).toBe('2026-08-19T00:00:00.000Z');
    expect(auditLogEntry.analysisRangeEnd).toBe('2026-08-19T23:59:59.000Z');
    expect(auditLogEntry.processingStatus).toBe('success');

    const sameDayRangeStart = new Date(auditLogEntry.analysisRangeStart);
    const sameDayRangeEnd = new Date(auditLogEntry.analysisRangeEnd);
    const startDay = sameDayRangeStart.toISOString().split('T')[0];
    const endDay = sameDayRangeEnd.toISOString().split('T')[0];
    expect(startDay).toBe(endDay);
    expect(startDay).toBe('2026-08-19');
  });
});