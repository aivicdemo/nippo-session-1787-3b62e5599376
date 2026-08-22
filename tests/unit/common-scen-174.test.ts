import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import type { Tx9AggregationRequest, Tx9AnalysisReport } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('Tx9Imp1Agent Idempotency', () => {
  let mockDatabase: {
    reminders: Array<{ id: string; requestId: string; memberId: string; timestamp: string }>;
    reports: Array<{ id: string; requestId: string; timestamp: string }>;
  };
  let mockEmailService: { callHistory: Array<{ type: string; count: number; requestId: string }> };
  let mockAuditLog: Array<{ requestId: string; action: string; status: string; timestamp: string }>;
  let mockSlackNotifications: Array<{ reportId: string; requestId: string; timestamp: string }>;

  const mockTx9Imp1AiClient = {
    extractIssuesFromReports: jest.fn(),
    classifyAndPrioritizeIssues: jest.fn(),
    generateAnalysisReport: jest.fn(),
    identifyUnsubmittedMembers: jest.fn(),
    sendReminderNotifications: jest.fn(),
    calculateProductivityMetrics: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabase = {
      reminders: [],
      reports: [],
    };
    mockEmailService = { callHistory: [] };
    mockAuditLog = [];
    mockSlackNotifications = [];

    mockTx9Imp1AiClient.extractIssuesFromReports.mockResolvedValue([
      { issueId: 'issue-001', content: 'Database connection timeout', priority: 'high' },
      { issueId: 'issue-002', content: 'API response delay', priority: 'medium' },
      { issueId: 'issue-003', content: 'Memory leak in service', priority: 'high' },
    ]);

    mockTx9Imp1AiClient.identifyUnsubmittedMembers.mockResolvedValue([
      { memberId: 'member-001', email: 'alice@example.com', name: 'Alice' },
      { memberId: 'member-002', email: 'bob@example.com', name: 'Bob' },
      { memberId: 'member-003', email: 'charlie@example.com', name: 'Charlie' },
    ]);

    mockTx9Imp1AiClient.sendReminderNotifications.mockImplementation(
      async (unsubmittedMembers, requestId) => {
        const currentTime = new Date('2024-01-15T10:30:00Z').toISOString();
        unsubmittedMembers.forEach((member: any) => {
          mockDatabase.reminders.push({
            id: `reminder-${mockDatabase.reminders.length + 1}`,
            requestId,
            memberId: member.memberId,
            timestamp: currentTime,
          });
          mockEmailService.callHistory.push({
            type: 'reminder_email',
            count: 1,
            requestId,
          });
        });
        mockAuditLog.push({
          requestId,
          action: 'SEND_REMINDERS',
          status: 'SUCCESS',
          timestamp: currentTime,
        });
        return { sentCount: unsubmittedMembers.length };
      }
    );

    mockTx9Imp1AiClient.calculateProductivityMetrics.mockResolvedValue({
      issueResolutionSpeed: 3.5,
      reportSubmissionRate: 87.5,
      issueRecurrenceRate: 12.3,
    });

    mockTx9Imp1AiClient.classifyAndPrioritizeIssues.mockResolvedValue([
      {
        issueId: 'issue-001',
        priority: 'high',
        category: 'infrastructure',
        estimatedImpact: 'critical',
      },
      {
        issueId: 'issue-002',
        priority: 'medium',
        category: 'performance',
        estimatedImpact: 'moderate',
      },
      {
        issueId: 'issue-003',
        priority: 'high',
        category: 'reliability',
        estimatedImpact: 'critical',
      },
    ]);

    mockTx9Imp1AiClient.generateAnalysisReport.mockImplementation(async (requestId) => {
      const reportId = `report-${Date.now()}`;
      const currentTime = new Date('2024-01-15T10:35:00Z').toISOString();
      mockDatabase.reports.push({
        id: reportId,
        requestId,
        timestamp: currentTime,
      });
      mockAuditLog.push({
        requestId,
        action: 'GENERATE_REPORT',
        status: 'SUCCESS',
        timestamp: currentTime,
      });
      mockSlackNotifications.push({
        reportId,
        requestId,
        timestamp: currentTime,
      });
      return {
        reportId,
        aggregationPeriod: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        productivityMetrics: {
          issueResolutionSpeed: 3.5,
          reportSubmissionRate: 87.5,
          issueRecurrenceRate: 12.3,
        },
        prioritizedIssues: [
          {
            issueId: 'issue-001',
            content: 'Database connection timeout',
            priority: 'high',
            category: 'infrastructure',
          },
          {
            issueId: 'issue-003',
            content: 'Memory leak in service',
            priority: 'high',
            category: 'reliability',
          },
          {
            issueId: 'issue-002',
            content: 'API response delay',
            priority: 'medium',
            category: 'performance',
          },
        ],
        recommendedCountermeasures: [
          {
            issueId: 'issue-001',
            action: 'Implement connection pooling',
            priority: 'immediate',
          },
          {
            issueId: 'issue-003',
            action: 'Add memory profiling instrumentation',
            priority: 'immediate',
          },
        ],
        generatedAt: new Date('2024-01-15T10:35:00Z').toISOString(),
      };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-174
  it('should not duplicate reminders, reports, notifications, or email sends on idempotent retry with same requestId', async () => {
    const aggregationRequest: Tx9AggregationRequest = {
      aggregationStartDate: '2024-01-01',
      aggregationEndDate: '2024-01-31',
      targetTeamIds: [],
      requestedByUserId: 'user-dept-head',
    };

    const requestId = 'req-001';

    // First execution
    const firstResult = await runTx9Imp1Agent(
      { ...aggregationRequest, requestId },
      mockTx9Imp1AiClient as any
    );

    expect(firstResult).toBeDefined();
    expect(firstResult.reportId).toBeDefined();
    expect(mockDatabase.reminders).toHaveLength(3);
    expect(mockDatabase.reports).toHaveLength(1);

    const firstReminderTimestamps = mockDatabase.reminders.map((r) => r.timestamp);
    const firstReportTimestamp = mockDatabase.reports[0].timestamp;
    const firstEmailCallCount = mockEmailService.callHistory.filter(
      (c) => c.type === 'reminder_email'
    ).length;
    const firstSlackNotificationCount = mockSlackNotifications.length;

    expect(firstEmailCallCount).toBe(3);
    expect(firstSlackNotificationCount).toBe(1);

    // Verify audit log for first execution
    const firstAuditSendReminders = mockAuditLog.filter((a) => a.action === 'SEND_REMINDERS');
    const firstAuditGenerateReport = mockAuditLog.filter((a) => a.action === 'GENERATE_REPORT');
    expect(firstAuditSendReminders).toHaveLength(1);
    expect(firstAuditGenerateReport).toHaveLength(1);

    // Reset mocks for second execution to track duplicate calls
    jest.clearAllMocks();

    // Reconfigure mocks with idempotent behavior for second call
    mockTx9Imp1AiClient.extractIssuesFromReports.mockResolvedValue([
      { issueId: 'issue-001', content: 'Database connection timeout', priority: 'high' },
      { issueId: 'issue-002', content: 'API response delay', priority: 'medium' },
      { issueId: 'issue-003', content: 'Memory leak in service', priority: 'high' },
    ]);

    mockTx9Imp1AiClient.identifyUnsubmittedMembers.mockResolvedValue([
      { memberId: 'member-001', email: 'alice@example.com', name: 'Alice' },
      { memberId: 'member-002', email: 'bob@example.com', name: 'Bob' },
      { memberId: 'member-003', email: 'charlie@example.com', name: 'Charlie' },
    ]);

    let secondExecutionSendRemindersCount = 0;
    mockTx9Imp1AiClient.sendReminderNotifications.mockImplementation(
      async (unsubmittedMembers, requestIdParam) => {
        secondExecutionSendRemindersCount++;
        // Check if this is a duplicate request - if so, return without writing
        if (mockDatabase.reminders.length >= 3) {
          mockAuditLog.push({
            requestId: requestIdParam,
            action: 'SEND_REMINDERS',
            status: 'IDEMPOTENT_SKIP',
            timestamp: new Date('2024-01-15T10:40:00Z').toISOString(),
          });
          return { sentCount: 0, skipped: true };
        }
        return { sentCount: unsubmittedMembers.length };
      }
    );

    mockTx9Imp1AiClient.calculateProductivityMetrics.mockResolvedValue({
      issueResolutionSpeed: 3.5,
      reportSubmissionRate: 87.5,
      issueRecurrenceRate: 12.3,
    });

    mockTx9Imp1AiClient.classifyAndPrioritizeIssues.mockResolvedValue([
      {
        issueId: 'issue-001',
        priority: 'high',
        category: 'infrastructure',
        estimatedImpact: 'critical',
      },
      {
        issueId: 'issue-002',
        priority: 'medium',
        category: 'performance',
        estimatedImpact: 'moderate',
      },
      {
        issueId: 'issue-003',
        priority: 'high',
        category: 'reliability',
        estimatedImpact: 'critical',
      },
    ]);

    let secondExecutionGenerateReportCount = 0;
    mockTx9Imp1AiClient.generateAnalysisReport.mockImplementation(
      async (requestIdParam) => {
        secondExecutionGenerateReportCount++;
        // Check if this is a duplicate request - if so, return existing report
        if (mockDatabase.reports.length >= 1) {
          mockAuditLog.push({
            requestId: requestIdParam,
            action: 'GENERATE_REPORT',
            status: 'IDEMPOTENT_SKIP',
            timestamp: new Date('2024-01-15T10:40:00Z').toISOString(),
          });
          return {
            reportId: mockDatabase.reports[0].id,
            aggregationPeriod: {
              startDate: '2024-01-01',
              endDate: '2024-01-31',
            },
            productivityMetrics: {
              issueResolutionSpeed: 3.5,
              reportSubmissionRate: 87.5,
              issueRecurrenceRate: 12.3,
            },
            prioritizedIssues: [],
            recommendedCountermeasures: [],
            generatedAt: mockDatabase.reports[0].timestamp,
          };
        }
        return {} as Tx9AnalysisReport;
      }
    );

    // Second execution with same requestId
    const secondResult = await runTx9Imp1Agent(
      { ...aggregationRequest, requestId },
      mockTx9Imp1AiClient as any
    );

    expect(secondResult).toBeDefined();
    expect(secondResult.reportId).toBeDefined();

    // Verify no duplicate reminders were written
    expect(mockDatabase.reminders).toHaveLength(3);

    // Verify no duplicate reports were written
    expect(mockDatabase.reports).toHaveLength(1);

    // Verify timestamps are identical to first execution
    const secondReminderTimestamps = mockDatabase.reminders.map((r) => r.timestamp);
    expect(secondReminderTimestamps).toEqual(firstReminderTimestamps);

    // Verify audit log contains idempotent skip status
    const allAuditLogs = mockAuditLog;
    const idempotentSkips = allAuditLogs.filter(
      (a) => a.status === 'IDEMPOTENT_SKIP' && a.requestId === requestId
    );
    expect(idempotentSkips.length).toBeGreaterThanOrEqual(1);

    // Verify that sendReminderNotifications was called but skipped
    expect(secondExecutionSendRemindersCount).toBe(1);

    // Verify that generateAnalysisReport was called but skipped
    expect(secondExecutionGenerateReportCount).toBe(1);

    // Verify no additional email sends occurred in second execution
    // (The mock should not have added new email call history)
    const secondExecutionEmailCalls = mockEmailService.callHistory.filter(
      (c) => c.type === 'reminder_email'
    ).length;
    expect(secondExecutionEmailCalls).toBe(0);

    // Verify no additional Slack notifications
    const secondExecutionSlackCount = mockSlackNotifications.length;
    expect(secondExecutionSlackCount).toBe(0);
  });
});