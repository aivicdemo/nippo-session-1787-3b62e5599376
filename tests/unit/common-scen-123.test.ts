import { runTx6Imp1Agent, type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('tx-6-imp-1 orchestrator', () => {
  // SCEN-123
  test('should rollback completed side effects and restore clean state when Action 4 fails with invalid analysis result', async () => {
    fetchMock.resetMocks();

    const mockReportRecords = Array.from({ length: 10 }, (_, i) => ({
      reportId: `report-${i + 1}`,
      teamId: 'team-001',
      content: `Report content ${i + 1}`,
      submittedAt: new Date('2024-01-08T09:00:00Z'),
    }));

    const mockUnsubmittedMembers = [
      { memberId: 'member-001', email: 'member1@example.com' },
      { memberId: 'member-002', email: 'member2@example.com' },
      { memberId: 'member-003', email: 'member3@example.com' },
    ];

    const mockExtractedIssues = Array.from({ length: 15 }, (_, i) => ({
      issueId: `issue-${i + 1}`,
      keyword: `Issue keyword ${i + 1}`,
      occurrenceCount: Math.floor(Math.random() * 5) + 1,
      category: ['quality', 'schedule', 'safety', 'other'][Math.floor(Math.random() * 4)],
    }));

    const mockInvalidAnalysisResult = {
      priorityScores: [-50, 150, 'invalid_score', null],
      categoryDistribution: { quality: 8, schedule: 4, invalid_category: 3 },
      trend: 'corrupted',
    };

    const mockAuditLogs: Array<{
      timestamp: Date;
      eventType: string;
      actionId: number;
      status: string;
      details?: string;
    }> = [];

    const mockInMemoryReportCache = new Map();
    const mockMailQueue: Array<{ memberId: string; email: string; timestamp: Date }> = [];
    const mockDatabaseState = {
      reports: new Map(),
      issues: new Map(),
    };

    const mockAiClient: Tx6Imp1AiClient = {
      async action01_collectReports(params) {
        mockAuditLogs.push({
          timestamp: new Date('2024-01-08T09:30:00Z'),
          eventType: 'ACTION_1_STARTED',
          actionId: 1,
          status: 'started',
        });

        mockReportRecords.forEach((record) => {
          mockInMemoryReportCache.set(record.reportId, record);
          mockDatabaseState.reports.set(record.reportId, record);
        });

        mockAuditLogs.push({
          timestamp: new Date('2024-01-08T09:35:00Z'),
          eventType: 'ACTION_1_COMPLETED',
          actionId: 1,
          status: 'completed',
          details: `Collected ${mockReportRecords.length} reports`,
        });

        return {
          collectedReportCount: mockReportRecords.length,
          reportIds: mockReportRecords.map((r) => r.reportId),
        };
      },

      async action02_identifyAndNotifyUnsubmitted(params) {
        mockAuditLogs.push({
          timestamp: new Date('2024-01-08T09:40:00Z'),
          eventType: 'ACTION_2_STARTED',
          actionId: 2,
          status: 'started',
        });

        mockUnsubmittedMembers.forEach((member) => {
          const mailRecord = {
            memberId: member.memberId,
            email: member.email,
            timestamp: new Date('2024-01-08T09:45:00Z'),
          };
          mockMailQueue.push(mailRecord);
        });

        mockAuditLogs.push({
          timestamp: new Date('2024-01-08T09:50:00Z'),
          eventType: 'ACTION_2_COMPLETED',
          actionId: 2,
          status: 'completed',
          details: `Notified ${mockUnsubmittedMembers.length} members`,
        });

        return {
          unsubmittedCount: mockUnsubmittedMembers.length,
          remindersSent: mockUnsubmittedMembers.length,
        };
      },

      async action03_extractAndClassifyIssues(params) {
        mockAuditLogs.push({
          timestamp: new Date('2024-01-08T10:00:00Z'),
          eventType: 'ACTION_3_STARTED',
          actionId: 3,
          status: 'started',
        });

        mockExtractedIssues.forEach((issue) => {
          mockDatabaseState.issues.set(issue.issueId, issue);
        });

        mockAuditLogs.push({
          timestamp: new Date('2024-01-08T10:10:00Z'),
          eventType: 'ACTION_3_COMPLETED',
          actionId: 3,
          status: 'completed',
          details: `Inserted ${mockExtractedIssues.length} issues`,
        });

        return {
          extractedIssueCount: mockExtractedIssues.length,
          issueIds: mockExtractedIssues.map((i) => i.issueId),
        };
      },

      async action04_analyzeTrends(params) {
        mockAuditLogs.push({
          timestamp: new Date('2024-01-08T10:20:00Z'),
          eventType: 'ACTION_4_STARTED',
          actionId: 4,
          status: 'started',
        });

        mockAuditLogs.push({
          timestamp: new Date('2024-01-08T10:25:00Z'),
          eventType: 'ACTION_4_FAILED',
          actionId: 4,
          status: 'failed',
          details: 'Invalid priority score detected',
        });

        throw new Error('Invalid priority score detected');
      },

      async action05_generateReport(params) {
        return {
          reportId: 'report-generated-001',
          reportGeneratedAt: new Date('2024-01-08T10:30:00Z'),
        };
      },

      async action06_distributeReport(params) {
        return {
          emailSentAt: new Date('2024-01-08T10:35:00Z'),
          recipientCount: 1,
        };
      },

      async action07_recordAuditLog(params) {
        return { logRecordId: 'audit-log-001' };
      },
    };

    const orchestratorInput = {
      executionTimestamp: new Date('2024-01-08T09:00:00Z'),
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-07',
      teamId: 'team-001',
    };

    let orchestrationError: Error | null = null;
    try {
      await runTx6Imp1Agent(orchestratorInput, mockAiClient);
    } catch (error) {
      orchestrationError = error as Error;
    }

    expect(orchestrationError).not.toBeNull();
    expect(orchestrationError?.message).toMatch(/Invalid priority score/);

    const failureAuditLog = mockAuditLogs.find((log) => log.eventType === 'ACTION_4_FAILED');
    expect(failureAuditLog).toBeDefined();
    expect(failureAuditLog?.actionId).toBe(4);

    const rollbackStartLog = mockAuditLogs.find((log) => log.eventType === 'ROLLBACK_STARTED');
    expect(rollbackStartLog).toBeDefined();

    const action3RollbackLog = mockAuditLogs.find((log) => log.eventType === 'ACTION_3_ROLLBACK');
    expect(action3RollbackLog).toBeDefined();
    expect(action3RollbackLog?.details).toMatch(/issues/i);

    const action2RollbackLog = mockAuditLogs.find((log) => log.eventType === 'ACTION_2_ROLLBACK');
    expect(action2RollbackLog).toBeDefined();
    expect(action2RollbackLog?.details).toMatch(/mail/i);

    const action1RollbackLog = mockAuditLogs.find((log) => log.eventType === 'ACTION_1_ROLLBACK');
    expect(action1RollbackLog).toBeDefined();
    expect(action1RollbackLog?.details).toMatch(/cache/i);

    const rollbackCompleteLog = mockAuditLogs.find((log) => log.eventType === 'ROLLBACK_COMPLETED');
    expect(rollbackCompleteLog).toBeDefined();

    expect(mockDatabaseState.issues.size).toBe(0);
    expect(mockDatabaseState.reports.size).toBe(0);
    expect(mockInMemoryReportCache.size).toBe(0);
    expect(mockMailQueue.length).toBe(0);

    const allAuditEvents = [
      'ACTION_1_STARTED',
      'ACTION_1_COMPLETED',
      'ACTION_2_STARTED',
      'ACTION_2_COMPLETED',
      'ACTION_3_STARTED',
      'ACTION_3_COMPLETED',
      'ACTION_4_STARTED',
      'ACTION_4_FAILED',
      'ROLLBACK_STARTED',
      'ACTION_3_ROLLBACK',
      'ACTION_2_ROLLBACK',
      'ACTION_1_ROLLBACK',
      'ROLLBACK_COMPLETED',
    ];

    allAuditEvents.forEach((eventType) => {
      const log = mockAuditLogs.find((l) => l.eventType === eventType);
      expect(log).toBeDefined();
    });

    const logTimestamps = mockAuditLogs.map((l) => l.timestamp.getTime());
    for (let i = 1; i < logTimestamps.length; i++) {
      expect(logTimestamps[i]).toBeGreaterThanOrEqual(logTimestamps[i - 1]);
    }
  });
});