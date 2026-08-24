import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-2431: [normal] 分析結果確定監査ログ記録機能 - データ範囲が前回比で拡張された場合、拡張された期間が変更点に記録される
  test('should record audit log with expanded data range details when analysis result is confirmed with extended period', () => {
    const previousAnalysisStartDate = new Date('2024-01-01T00:00:00Z');
    const previousAnalysisEndDate = new Date('2024-01-15T23:59:59Z');
    const newAnalysisStartDate = new Date('2024-01-01T00:00:00Z');
    const newAnalysisEndDate = new Date('2024-01-31T23:59:59Z');
    const approverUserId = 'user-manager-001';
    const reportId = 'report-2024-01';

    const monthlyReportApprovalInput = {
      reportId: reportId,
      approvalStatus: 'approved' as const,
      rejectionReason: undefined,
      approverUserId: approverUserId,
      previousDataRange: {
        startDate: previousAnalysisStartDate,
        endDate: previousAnalysisEndDate,
      },
      currentDataRange: {
        startDate: newAnalysisStartDate,
        endDate: newAnalysisEndDate,
      },
    };

    const result = validateMonthlyReportApproval(monthlyReportApprovalInput);

    expect(result).toBeDefined();
    expect(result.reportId).toBe(reportId);
    expect(result.approvalStatus).toBe('approved');
    expect(result.processedAt).toBeInstanceOf(Date);

    const timeDifferenceSeconds = Math.abs(
      result.processedAt.getTime() - new Date().getTime()
    ) / 1000;
    expect(timeDifferenceSeconds).toBeLessThanOrEqual(5);

    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.operationType).toBe('ANALYSIS_RESULT_CONFIRMED');
    expect(result.auditLog.changeType).toBe('DATA_RANGE_EXPANSION');
    expect(result.auditLog.changeReason).toBe('DATA_RANGE_EXPANDED');
    expect(result.auditLog.recordedBy).toBe(approverUserId);
    expect(result.auditLog.confirmedAt).toBeInstanceOf(Date);

    const changeDetailsTimeDifference = Math.abs(
      result.auditLog.confirmedAt.getTime() - new Date().getTime()
    ) / 1000;
    expect(changeDetailsTimeDifference).toBeLessThanOrEqual(5);

    expect(result.auditLog.changeDetails).toContain('2024-01-01');
    expect(result.auditLog.changeDetails).toContain('2024-01-15');
    expect(result.auditLog.changeDetails).toContain('2024-01-31');
    expect(result.auditLog.changeDetails).toContain('2024-01-16');
    expect(result.auditLog.changeDetails).toMatch(/Extended Period.*2024-01-16.*2024-01-31/);

    expect(result.nextAction).toBe('proceed_to_management_report');
  });
});