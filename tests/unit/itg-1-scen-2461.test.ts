import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア順序付け機能', () => {
  // SCEN-2461: [edge] 分析結果監査ログ記録機能 - データ範囲が30日間直下（29日間）で記録される
  test('should record analysis audit log with 29-day data range boundary validation', () => {
    const startDate = new Date('2026-01-01T00:00:00Z');
    const endDate = new Date('2026-01-29T23:59:59Z');
    const executorUserId = 'user-001';
    const analysisExecutionTime = new Date('2026-01-29T10:00:00Z');

    const reportId = 'report-monthly-2026-01';
    const approvalStatus = 'approved';
    const approverUserId = 'manager-001';

    const result = validateMonthlyReportApproval({
      reportId,
      approvalStatus,
      approverUserId,
      startDate,
      endDate,
      executorUserId,
      executedAt: analysisExecutionTime,
    });

    expect(result).toBeDefined();
    expect(result.auditLogRecord).toBeDefined();

    const auditLog = result.auditLogRecord;

    expect(auditLog.dataPeriodStart).toEqual(startDate);
    expect(auditLog.dataPeriodEnd).toEqual(endDate);

    const daysDifference = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysDifference).toBe(28);

    expect(auditLog.logType).toBe('分析実行');

    expect(auditLog.processingStatus).toBe('完了');

    expect(auditLog.timestamp).toBeDefined();
    expect(auditLog.timestamp).toBeInstanceOf(Date);

    expect(auditLog.reportId).toBe(reportId);
    expect(auditLog.approvalStatus).toBe(approvalStatus);
    expect(auditLog.approverUserId).toBe(approverUserId);

    const totalDaysInRange = daysDifference + 1;
    expect(totalDaysInRange).toBeLessThan(30);
  });
});