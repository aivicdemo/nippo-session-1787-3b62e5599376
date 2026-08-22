import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';

// Mock types for test
interface MockReportData {
  reportId: string;
  content: string;
  status: 'unprocessed' | 'processed';
}

interface MockEmailLog {
  recipient: string;
  subject: string;
  body: string;
  timestamp: Date;
}

interface MockAuditLog {
  eventId: string;
  action: string;
  reportId: string;
  timestamp: Date;
  flags: string[];
}

interface MockDatabase {
  reports: Map<string, MockReportData>;
  emailLogs: MockEmailLog[];
  auditLogs: MockAuditLog[];
}

interface MockAiClientResponse {
  aggregationStatus: string;
  extractedIssuesCount: number;
  prioritizedIssuesList: Array<{ issue: string; priority: string }>;
  emailSendStatus: string;
}

describe('runTx2Imp1Agent - Idempotent Retry (SCEN-054)', () => {
  let mockDb: MockDatabase;
  let mockAiClient: {
    callExtractAndClassify: jest.Mock;
    callPrioritize: jest.Mock;
  };

  beforeEach(() => {
    // Initialize mock database
    mockDb = {
      reports: new Map([
        [
          'report-001',
          {
            reportId: 'report-001',
            content:
              '昨日：機能A実装 / 今日：機能B実装 / 課題：API応答遅延',
            status: 'unprocessed',
          },
        ],
      ]),
      emailLogs: [],
      auditLogs: [],
    };

    // Initialize mock AI client
    mockAiClient = {
      callExtractAndClassify: jest.fn().mockResolvedValue({
        extractedIssues: [
          {
            issue: 'API応答遅延',
            category: 'performance',
          },
        ],
      }),
      callPrioritize: jest.fn().mockResolvedValue({
        prioritizedIssuesList: [
          {
            issue: 'API応答遅延',
            priority: '高',
          },
        ],
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('SCEN-054: 同一の日報に対する複数回実行時に重複書き込みと重複通知が発生しないこと', async () => {
    // Mock implementations
    const mockSendEmail = jest.fn(async (recipient: string, subject: string, body: string) => {
      mockDb.emailLogs.push({
        recipient,
        subject,
        body,
        timestamp: new Date('2024-01-15T11:00:00Z'),
      });
    });

    const mockLogAuditEvent = jest.fn((action: string, reportId: string, flags: string[]) => {
      const eventId = `event-${mockDb.auditLogs.length + 1}`;
      mockDb.auditLogs.push({
        eventId,
        action,
        reportId,
        timestamp: new Date('2024-01-15T11:00:00Z'),
        flags,
      });
    });

    const mockUpdateReportStatus = jest.fn((reportId: string, status: 'processed') => {
      const report = mockDb.reports.get(reportId);
      if (report) {
        report.status = status;
      }
    });

    const mockGetReportById = jest.fn((reportId: string) => {
      return mockDb.reports.get(reportId);
    });

    const mockRecordExtractedIssue = jest.fn((reportId: string, issue: string) => {
      // Simulate recording extracted issue - this should be idempotent
      // Check if already recorded in audit logs
      const alreadyRecorded = mockDb.auditLogs.some(
        (log) => log.action === 'extract_issue' && log.reportId === reportId
      );
      if (!alreadyRecorded) {
        mockLogAuditEvent('extract_issue', reportId, []);
      }
    });

    // Create mock AI client that matches Tx2Imp1AiClient interface
    const mockTx2Imp1AiClient = {
      callAiForExtraction: mockAiClient.callExtractAndClassify,
      callAiForPrioritization: mockAiClient.callPrioritize,
    };

    // Execute first run
    const input1 = {
      executionTimestamp: new Date('2024-01-15T11:00:00Z'),
      teamId: 'team-001',
      reportingDeadline: new Date('2024-01-15T09:30:00Z'),
      managerEmail: 'manager@example.com',
    };

    const result1 = await runTx2Imp1Agent(input1, {
      ...mockTx2Imp1AiClient,
      sendEmail: mockSendEmail,
      logAuditEvent: mockLogAuditEvent,
      updateReportStatus: mockUpdateReportStatus,
      getReportById: mockGetReportById,
      recordExtractedIssue: mockRecordExtractedIssue,
      getAllReports: jest.fn().mockResolvedValue(Array.from(mockDb.reports.values())),
      getUnsubmittedMembers: jest.fn().mockResolvedValue([]),
    });

    // Verify first run results
    expect(result1.aggregationStatus).toBe('success');
    expect(result1.extractedIssuesCount).toBe(1);
    expect(result1.emailSendStatus).toBe('sent');
    expect(result1.prioritizedIssuesList).toEqual([
      {
        issue: 'API応答遅延',
        priority: '高',
      },
    ]);

    // Verify database state after first run
    const reportAfterFirstRun = mockDb.reports.get('report-001');
    expect(reportAfterFirstRun?.status).toBe('processed');

    // Verify email was sent exactly once
    expect(mockDb.emailLogs).toHaveLength(1);
    expect(mockDb.emailLogs[0].recipient).toBe('manager@example.com');
    expect(mockDb.emailLogs[0].body).toContain('優先度：高');
    expect(mockDb.emailLogs[0].body).toContain('課題：API応答遅延');

    // Verify audit log has first execution record
    expect(mockDb.auditLogs.length).toBeGreaterThan(0);
    const firstExecutionLog = mockDb.auditLogs[mockDb.auditLogs.length - 1];
    expect(firstExecutionLog.reportId).toBe('report-001');

    // Store counts after first run
    const emailCountAfterFirstRun = mockDb.emailLogs.length;
    const auditCountAfterFirstRun = mockDb.auditLogs.length;
    const extractedIssueCountAfterFirstRun = mockDb.auditLogs.filter(
      (log) => log.action === 'extract_issue' && log.reportId === 'report-001'
    ).length;

    // Execute second run (idempotent retry)
    const result2 = await runTx2Imp1Agent(input1, {
      ...mockTx2Imp1AiClient,
      sendEmail: mockSendEmail,
      logAuditEvent: mockLogAuditEvent,
      updateReportStatus: mockUpdateReportStatus,
      getReportById: mockGetReportById,
      recordExtractedIssue: mockRecordExtractedIssue,
      getAllReports: jest.fn().mockResolvedValue(Array.from(mockDb.reports.values())),
      getUnsubmittedMembers: jest.fn().mockResolvedValue([]),
    });

    // Verify second run completes
    expect(result2.aggregationStatus).toBe('success');

    // Verify database state unchanged after second run
    const reportAfterSecondRun = mockDb.reports.get('report-001');
    expect(reportAfterSecondRun?.status).toBe('processed');

    // Verify no duplicate email was sent
    expect(mockDb.emailLogs).toHaveLength(emailCountAfterFirstRun);

    // Verify no duplicate issue records
    const extractedIssueCountAfterSecondRun = mockDb.auditLogs.filter(
      (log) => log.action === 'extract_issue' && log.reportId === 'report-001'
    ).length;
    expect(extractedIssueCountAfterSecondRun).toBe(extractedIssueCountAfterFirstRun);

    // Verify audit log has new execution record with idempotent_retry flag
    expect(mockDb.auditLogs.length).toBe(auditCountAfterFirstRun + 1);
    const secondExecutionLog = mockDb.auditLogs[mockDb.auditLogs.length - 1];
    expect(secondExecutionLog.reportId).toBe('report-001');
    expect(secondExecutionLog.flags).toContain('idempotent_retry');

    // Verify total email count remains 1 (no duplicates)
    expect(mockDb.emailLogs).toHaveLength(1);
    expect(mockDb.emailLogs[0].recipient).toBe('manager@example.com');
  });
});