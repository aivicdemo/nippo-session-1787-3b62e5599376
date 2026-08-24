import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Report Approval Audit Logging - Logic Version Tracking', () => {
  it('SCEN-2430: records version difference in audit log when priority judgment logic version increments', async () => {
    // Setup: Previous audit log state with logic version v2.0
    const previousAuditLogEntry = {
      reportId: 'report-2024-01',
      executionDate: new Date('2024-01-15T09:00:00Z'),
      executorId: 'user-dept-head-001',
      priorityJudgmentLogicVersion: 'v2.0',
      analysisDetails: 'Previous analysis with v2.0 logic',
    };

    // Current state: Logic version upgraded to v2.1
    const currentLogicVersion = 'v2.1';

    // Input: Monthly report approval request
    const approvalInput = {
      reportId: 'report-2024-02',
      approvalStatus: 'approved' as const,
      approverUserId: 'user-dept-head-001',
    };

    // Mock TextAnalysisServiceAdapter that returns analysis with v2.1
    const mockTextAnalysisAdapter = {
      extractKeywords: async () => ({
        keywords: ['performance', 'quality'],
        occurrenceFrequency: [5, 3],
        logicVersion: 'v2.1',
      }),
      assessImpactScore: async () => ({
        impactScores: [75, 50],
        logicVersion: 'v2.1',
      }),
      classifyIssueSeverity: async () => ({
        classifications: ['high', 'medium'],
        logicVersion: 'v2.1',
      }),
    };

    // Mock AuditLogRepository to capture recorded logs
    const recordedAuditLogs: Array<{
      reportId: string;
      executionDate: Date;
      executorId: string;
      previousLogicVersion: string;
      currentLogicVersion: string;
      versionDifference: string;
      changeDetails: string;
    }> = [];

    const mockAuditLogRepository = {
      recordAnalysisCompletionLog: async (logEntry: any) => {
        recordedAuditLogs.push(logEntry);
        return logEntry;
      },
      getLatestVersionByReportId: async () => previousAuditLogEntry,
    };

    // Execute: Call validateMonthlyReportApproval with mocked dependencies
    const result = await validateMonthlyReportApproval(
      approvalInput,
      mockTextAnalysisAdapter,
      mockAuditLogRepository,
      currentLogicVersion
    );

    // Verify: Result indicates approval success
    expect(result.reportId).toBe('report-2024-02');
    expect(result.approvalStatus).toBe('approved');
    expect(result.processedAt).toBeInstanceOf(Date);

    // Verify: Exactly one audit log entry was recorded
    expect(recordedAuditLogs).toHaveLength(1);

    // Extract recorded audit log
    const recordedLog = recordedAuditLogs[0];

    // Verify: Previous version is correctly recorded as v2.0
    expect(recordedLog.previousLogicVersion).toBe('v2.0');

    // Verify: Current version is correctly recorded as v2.1
    expect(recordedLog.currentLogicVersion).toBe('v2.1');

    // Verify: Version difference is calculated and recorded as +0.1
    expect(recordedLog.versionDifference).toBe('+0.1');

    // Verify: Change details include full version transition with difference
    expect(recordedLog.changeDetails).toBe(
      'Priority judgment logic version: v2.0 → v2.1 (difference: +0.1)'
    );

    // Verify: Report ID matches input
    expect(recordedLog.reportId).toBe('report-2024-02');

    // Verify: Executor ID matches approver
    expect(recordedLog.executorId).toBe('user-dept-head-001');

    // Verify: Execution date is recorded as current timestamp (within 1 second)
    const timeDifference = Math.abs(
      recordedLog.executionDate.getTime() - new Date().getTime()
    );
    expect(timeDifference).toBeLessThan(1000);
  });
});