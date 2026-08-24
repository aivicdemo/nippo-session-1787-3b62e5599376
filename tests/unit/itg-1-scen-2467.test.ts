import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Priority Judgment Engine Audit Log', () => {
  // SCEN-2467: [edge] 分析結果監査ログ記録機能 - 優先度判定ロジックバージョンが端数を含む小数形式で記録される
  test('should record priority judgment logic version with decimal precision in audit log', async () => {
    const priorityJudgmentEngineVersion = 2.5;
    const auditLogRecorder = {
      recordAuditEvent: jest.fn().mockResolvedValue({
        auditLogId: 'audit-log-001',
        timestamp: new Date('2024-01-15T11:00:00Z'),
        priorityJudgmentLogicVersion: priorityJudgmentEngineVersion,
        executorUserId: 'user-123',
        judgmentDetails: 'Issue severity classified via TextAnalysisServiceAdapter',
        decisionRationale: 'Decimal version precision maintained',
      }),
    };

    const textAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'database_failure', frequency: 3, confidence: 0.95 },
        { keyword: 'api_timeout', frequency: 2, confidence: 0.87 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue({
        overallImpactScore: 78,
        affectedTeamCount: 5,
        estimatedRecoveryHours: 4,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
        classification: 'database_failure',
        confidenceScore: 0.95,
        auditLogEntryId: 'audit-log-001',
      }),
    };

    const reportApprovalInput = {
      reportId: 'report-2024-01-15-001',
      approvalStatus: 'approved' as const,
      approverUserId: 'dept-head-456',
    };

    const result = await validateMonthlyReportApproval(
      reportApprovalInput,
      {
        auditLogRecorder,
        textAnalysisServiceAdapter,
        priorityJudgmentEngineVersion,
      }
    );

    expect(result).toBeDefined();
    expect(result.reportId).toBe('report-2024-01-15-001');
    expect(result.approvalStatus).toBe('approved');

    expect(auditLogRecorder.recordAuditEvent).toHaveBeenCalled();
    const auditLogCall = auditLogRecorder.recordAuditEvent.mock.calls[0];
    const recordedAuditLog = await auditLogCall[0];
    expect(recordedAuditLog.priorityJudgmentLogicVersion).toBe(2.5);
    expect(typeof recordedAuditLog.priorityJudgmentLogicVersion).toBe('number');

    expect(textAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalled();

    const auditLogResult = await auditLogRecorder.recordAuditEvent(recordedAuditLog);
    expect(auditLogResult.priorityJudgmentLogicVersion).toStrictEqual(2.5);
  });
});