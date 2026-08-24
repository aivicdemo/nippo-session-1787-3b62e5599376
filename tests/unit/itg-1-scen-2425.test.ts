import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Audit Log Recording', () => {
  test('SCEN-2425: Analysis result confirmation records audit log with change tracking', () => {
    // Arrange: Previous analysis result
    const previousKeywords = ['バグ対応', 'サーバーダウン'];
    const previousImpactScores = [75, 80];
    const previousImportanceRanks = ['高', '高'];
    const previousConfirmedAt = new Date('2024-01-14T09:00:00Z');
    const previousAnalysisResult = {
      keywords: previousKeywords,
      impactScores: previousImpactScores,
      importanceRanks: previousImportanceRanks,
      confirmedAt: previousConfirmedAt,
      confirmedByUserId: 'user-dept-head-001',
    };

    // New analysis result from TextAnalysisServiceAdapter mock
    const newKeywords = ['バグ対応', 'API遅延'];
    const newImpactScores = [75, 55];
    const newImportanceRanks = ['高', '中'];
    const newAnalysisResult = {
      keywords: newKeywords,
      impactScores: newImpactScores,
      importanceRanks: newImportanceRanks,
    };

    const approvalInput = {
      reportId: 'report-monthly-2024-01',
      approvalStatus: 'approved' as const,
      approverUserId: 'user-dept-head-001',
    };

    // Act
    const approvalResult = validateMonthlyReportApproval(
      approvalInput,
      previousAnalysisResult,
      newAnalysisResult
    );

    // Assert: Approval result indicates success
    expect(approvalResult).toEqual(
      expect.objectContaining({
        reportId: 'report-monthly-2024-01',
        approvalStatus: 'approved',
        processedAt: expect.any(Date),
        nextAction: 'proceed_to_management_report',
      })
    );

    // Assert: Audit log records keyword changes
    const auditLog = approvalResult.auditLog;
    expect(auditLog).toBeDefined();
    expect(auditLog.logType).toBe('分析結果確定');
    expect(auditLog.previousKeywords).toEqual(previousKeywords);
    expect(auditLog.newKeywords).toEqual(newKeywords);

    // Assert: Deleted and added keywords are explicitly recorded
    expect(auditLog.deletedKeywords).toEqual(['サーバーダウン']);
    expect(auditLog.addedKeywords).toEqual(['API遅延']);

    // Assert: Impact score changes are recorded
    expect(auditLog.previousImpactScores).toEqual(previousImpactScores);
    expect(auditLog.newImpactScores).toEqual(newImpactScores);

    // Assert: Score change delta is recorded (e.g., 'サーバーダウン: -80')
    expect(auditLog.scoreDeltas).toContain('サーバーダウン: -80');
    expect(auditLog.scoreDeltas).toContain('API遅延: +55');

    // Assert: Confirmed user ID, confirmed timestamp, and change count are recorded
    expect(auditLog.confirmedByUserId).toBe('user-dept-head-001');
    expect(auditLog.confirmedAt).toEqual(expect.any(Date));
    expect(auditLog.changeCount).toBe(2);

    // Assert: Importance rank changes are tracked
    expect(auditLog.previousImportanceRanks).toEqual(previousImportanceRanks);
    expect(auditLog.newImportanceRanks).toEqual(newImportanceRanks);
  });
});