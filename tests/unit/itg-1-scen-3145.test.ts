import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import type { Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('tx-4-imp-1 orchestrator rollback on partial failure', () => {
  // SCEN-3145
  test('should rollback all side effects and log audit trail when Action 4 system integration fails', async () => {
    const mockDatabaseConnection = {
      aggregatedDataRecords: [] as any[],
      extractedIssueRecords: [] as any[],
      riskAssessmentRecords: [] as any[],
      auditLogRecords: [] as any[],
      insertAggregatedData: function(data: any) {
        this.aggregatedDataRecords.push({ ...data, id: `agg_${Date.now()}` });
      },
      insertExtractedIssue: function(data: any) {
        this.extractedIssueRecords.push({ ...data, id: `issue_${Date.now()}` });
      },
      insertRiskAssessment: function(data: any) {
        this.riskAssessmentRecords.push({ ...data, id: `risk_${Date.now()}` });
      },
      insertAuditLog: function(data: any) {
        this.auditLogRecords.push({ ...data, timestamp: new Date('2024-01-15T11:15:30Z') });
      },
      rollbackRecords: function(executionId: string) {
        this.aggregatedDataRecords = this.aggregatedDataRecords.filter((r: any) => r.executionId !== executionId);
        this.extractedIssueRecords = this.extractedIssueRecords.filter((r: any) => r.executionId !== executionId);
        this.riskAssessmentRecords = this.riskAssessmentRecords.filter((r: any) => r.executionId !== executionId);
      },
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [{ text: 'network_latency', frequency: 3 }],
      }),
      assessImpactScore: jest.fn().mockRejectedValue(
        new Error('TextAnalysis service timeout after 30s'),
      ),
      classifyIssueSeverity: jest.fn(),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockAiClient: Tx4Imp1AiClient = {
      action01_aggregateRealtimeData: jest.fn().mockResolvedValue({
        executionId: 'exec_20240115_001',
        dashboardDataSnapshot: {
          teamId: 'team_dev_001',
          timestamp: '2024-01-15T11:00:00Z',
          activeTasksCount: 24,
          delayedTasksCount: 3,
          unsubmittedReportCount: 2,
        },
      }),
      action02_extractIssues: jest.fn().mockResolvedValue({
        executionId: 'exec_20240115_001',
        extractedIssues: [
          { issueId: 'iss_001', keyword: 'network_latency', description: 'API timeout issues reported by 3 members' },
          { issueId: 'iss_002', keyword: 'database_lock', description: 'Concurrent update blocking detected' },
        ],
      }),
      action03_assessRecurrenceRisk: jest.fn().mockResolvedValue({
        executionId: 'exec_20240115_001',
        riskAssessments: [
          { issueId: 'iss_001', recurrenceRiskScore: 78, lastOccurrenceDaysAgo: 5 },
          { issueId: 'iss_002', recurrenceRiskScore: 45, lastOccurrenceDaysAgo: 12 },
        ],
      }),
      action04_prioritizeIssues: jest.fn().mockImplementation(async () => {
        throw new Error('TextAnalysis service timeout after 30s');
      }),
      action05_generateCountermeasurePlan: jest.fn(),
      action06_generateDashboardReport: jest.fn(),
      action07_sendUnsubmittedMemberNotification: jest.fn(),
    };

    const input = {
      teamId: 'team_dev_001',
      managerId: 'mgr_yamada_001',
      reportDate: '2024-01-15',
      meetingStartTime: '09:30',
    };

    let caughtError: Error | null = null;
    let executionId: string | null = null;

    try {
      // Simulate database interactions during execution
      mockAiClient.action01_aggregateRealtimeData.mockImplementation(async () => {
        const result = {
          executionId: 'exec_20240115_001',
          dashboardDataSnapshot: {
            teamId: 'team_dev_001',
            timestamp: '2024-01-15T11:00:00Z',
            activeTasksCount: 24,
            delayedTasksCount: 3,
            unsubmittedReportCount: 2,
          },
        };
        executionId = result.executionId;
        mockDatabaseConnection.insertAggregatedData({
          executionId: result.executionId,
          ...result.dashboardDataSnapshot,
        });
        return result;
      });

      mockAiClient.action02_extractIssues.mockImplementation(async () => {
        const result = {
          executionId: 'exec_20240115_001',
          extractedIssues: [
            { issueId: 'iss_001', keyword: 'network_latency', description: 'API timeout issues reported by 3 members' },
            { issueId: 'iss_002', keyword: 'database_lock', description: 'Concurrent update blocking detected' },
          ],
        };
        result.extractedIssues.forEach((issue: any) => {
          mockDatabaseConnection.insertExtractedIssue({
            executionId: result.executionId,
            ...issue,
          });
        });
        return result;
      });

      mockAiClient.action03_assessRecurrenceRisk.mockImplementation(async () => {
        const result = {
          executionId: 'exec_20240115_001',
          riskAssessments: [
            { issueId: 'iss_001', recurrenceRiskScore: 78, lastOccurrenceDaysAgo: 5 },
            { issueId: 'iss_002', recurrenceRiskScore: 45, lastOccurrenceDaysAgo: 12 },
          ],
        };
        result.riskAssessments.forEach((assessment: any) => {
          mockDatabaseConnection.insertRiskAssessment({
            executionId: result.executionId,
            ...assessment,
          });
        });
        return result;
      });

      mockAiClient.action04_prioritizeIssues.mockImplementation(async () => {
        mockDatabaseConnection.insertAuditLog({
          executionId: 'exec_20240115_001',
          action: 'action_04_prioritize_issues',
          status: 'IN_PROGRESS',
          detail: 'Calling TextAnalysisServiceAdapter.assessImpactScore',
        });
        throw new Error('TextAnalysis service timeout after 30s');
      });

      await runTx4Imp1Agent(input, mockAiClient);
    } catch (error) {
      caughtError = error instanceof Error ? error : new Error(String(error));
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toMatch(/TextAnalysis service/);
    expect(caughtError?.message).not.toMatch(/password|schema|internal/i);

    mockDatabaseConnection.rollbackRecords('exec_20240115_001');

    expect(mockDatabaseConnection.aggregatedDataRecords).toHaveLength(0);
    expect(mockDatabaseConnection.extractedIssueRecords).toHaveLength(0);
    expect(mockDatabaseConnection.riskAssessmentRecords).toHaveLength(0);

    mockDatabaseConnection.insertAuditLog({
      executionId: 'exec_20240115_001',
      action: 'rollback',
      status: 'COMPLETED',
      detail: 'Agent execution failed at Action 4: TextAnalysis service error',
      failureTimestamp: '2024-01-15T11:15:30Z',
    });

    const auditLogs = mockDatabaseConnection.auditLogRecords;
    expect(auditLogs.length).toBeGreaterThanOrEqual(1);
    const failureLog = auditLogs.find(
      (log: any) => log.detail && log.detail.includes('Agent execution failed at Action 4'),
    );
    expect(failureLog).toBeDefined();
    expect(failureLog?.status).toBe('COMPLETED');

    const rollbackLog = auditLogs.find(
      (log: any) => log.action === 'rollback' && log.status === 'COMPLETED',
    );
    expect(rollbackLog).toBeDefined();
    expect(rollbackLog?.detail).toMatch(/Rollback completed/);

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockAiClient.action06_generateDashboardReport).not.toHaveBeenCalled();
    expect(mockAiClient.action07_sendUnsubmittedMemberNotification).not.toHaveBeenCalled();
  });
});