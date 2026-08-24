import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

// SCEN-2424
describe('validateMonthlyReportApproval - audit log recording for analysis finalization', () => {
  it('should record analysis finalization with executor ID, finalized timestamp, data range, and logic version in audit log', async () => {
    const executedByUserId = 'tester001';
    const finalizedAtTimestamp = '2024-12-20T09:30:45.000Z';
    const dataRangeFromDate = '2024-12-01T00:00:00.000Z';
    const dataRangeToDate = '2024-12-31T23:59:59.999Z';
    const priorityJudgmentLogicVersion = 'v1.2.3';

    const approvalInput = {
      reportId: 'report_2024_12_001',
      approvalStatus: 'approved' as const,
      approverUserId: executedByUserId,
    };

    const mockAuditLogEntry = {
      reportId: approvalInput.reportId,
      executedBy: executedByUserId,
      finalizedAt: finalizedAtTimestamp,
      dataRangeFrom: dataRangeFromDate,
      dataRangeTo: dataRangeToDate,
      priorityJudgmentLogicVersion: priorityJudgmentLogicVersion,
      analysisFinalizedAt: finalizedAtTimestamp,
      createdAt: finalizedAtTimestamp,
    };

    const result = await validateMonthlyReportApproval(
      approvalInput.reportId,
      approvalInput.approvalStatus,
      approvalInput.approverUserId,
      dataRangeFromDate,
      dataRangeToDate,
      priorityJudgmentLogicVersion
    );

    expect(result).toEqual({
      reportId: approvalInput.reportId,
      approvalStatus: 'approved',
      processedAt: expect.any(Date),
      nextAction: 'proceed_to_management_report',
      auditLog: expect.objectContaining({
        executedBy: executedByUserId,
        finalizedAt: expect.any(String),
        dataRangeFrom: dataRangeFromDate,
        dataRangeTo: dataRangeToDate,
        priorityJudgmentLogicVersion: priorityJudgmentLogicVersion,
      }),
    });

    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.executedBy).toBe(executedByUserId);
    expect(result.auditLog.dataRangeFrom).toBe(dataRangeFromDate);
    expect(result.auditLog.dataRangeTo).toBe(dataRangeToDate);
    expect(result.auditLog.priorityJudgmentLogicVersion).toBe(
      priorityJudgmentLogicVersion
    );
  });
});