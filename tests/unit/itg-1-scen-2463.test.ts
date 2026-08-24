import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-2463: [edge] 分析結果監査ログ記録機能 - 確定日時が月末日23:59:59で記録される
  test('should record audit log with confirmed_timestamp at month-end 23:59:59 in ISO 8601 format', () => {
    const mockCurrentDateTime = new Date('2026-02-28T23:59:59Z');
    const mockReportId = 'report-2026-02-28-001';
    const mockApproverUserId = 'user-department-head-001';
    const mockRejectionReason = undefined;

    const input: Parameters<typeof validateMonthlyReportApproval>[0] = {
      reportId: mockReportId,
      approvalStatus: 'approved',
      rejectionReason: mockRejectionReason,
      approverUserId: mockApproverUserId,
    };

    const result = validateMonthlyReportApproval(input);

    expect(result).toBeDefined();
    expect(result.reportId).toBe(mockReportId);
    expect(result.approvalStatus).toBe('approved');
    expect(result.processedAt).toEqual(mockCurrentDateTime);
    expect(result.nextAction).toBe('proceed_to_management_report');

    const expectedAuditLogTimestamp = '2026-02-28T23:59:59Z';
    expect(result.processedAt.toISOString()).toBe(expectedAuditLogTimestamp);

    const isoFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    expect(result.processedAt.toISOString()).toMatch(isoFormatRegex);
  });
});