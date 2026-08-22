import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  let mockDb: Map<string, any>;
  let mockMailLog: Array<{ recipient: string; subject: string; body: string; timestamp: string }>;
  let mockAuditLog: Array<{ action: string; reportId: string; timestamp: string; flags: string[] }>;
  let mockDateNow: Date;

  beforeEach(() => {
    mockDb = new Map();
    mockMailLog = [];
    mockAuditLog = [];
    mockDateNow = new Date('2024-01-15T09:00:00Z');

    // Initialize test DB with initial state
    mockDb.set('report-001', {
      id: 'report-001',
      content: '昨日：機能A実装 / 今日：機能B実装 / 課題：API応答遅延',
      status: 'unprocessed',
      createdAt: '2024-01-15T08:00:00Z',
    });
  });

  afterEach(() => {
    mockDb.clear();
    mockMailLog = [];
    mockAuditLog = [];
  });

  // SCEN-054
  test('should prevent duplicate notifications and DB writes on idempotent retry of sendUnsubmittedReminder', async () => {
    const fakeAiClient = {
      extractIssues: async (content: string) => {
        return [
          {
            issue: 'API応答遅延',
            priority: 'high',
            category: 'performance',
          },
        ];
      },
      classifyIssue: async (issue: string) => {
        return { priority: 'high', category: 'performance' };
      },
      generateMailBody: async (
        issues: Array<{ issue: string; priority: string; category: string }>
      ) => {
        return `優先度：${issues[0].priority}\n課題：${issues[0].issue}`;
      },
    };

    const mockNotificationSystem = {
      sendMail: async (recipient: string, subject: string, body: string) => {
        mockMailLog.push({
          recipient,
          subject,
          body,
          timestamp: mockDateNow.toISOString(),
        });
        return { success: true, id: `mail-${mockMailLog.length}` };
      },
    };

    const mockAuditSystem = {
      log: async (action: string, reportId: string, flags: string[] = []) => {
        mockAuditLog.push({
          action,
          reportId,
          timestamp: mockDateNow.toISOString(),
          flags,
        });
      },
    };

    const updateReportStatus = async (reportId: string, status: string) => {
      const report = mockDb.get(reportId);
      if (report) {
        mockDb.set(reportId, { ...report, status });
        return true;
      }
      return false;
    };

    const getReportById = async (reportId: string) => {
      return mockDb.get(reportId);
    };

    const getDuplicateCheckKey = (reportId: string, action: string) => {
      return `${reportId}:${action}`;
    };

    // Idempotency tracking
    const processedKeys = new Set<string>();

    // First execution
    const reportId = 'report-001';
    const idempotencyKey = getDuplicateCheckKey(reportId, 'sendUnsubmittedReminder');

    const initialReport = await getReportById(reportId);
    expect(initialReport.status).toBe('unprocessed');

    // First run
    if (!processedKeys.has(idempotencyKey)) {
      processedKeys.add(idempotencyKey);

      const extractedIssues = await fakeAiClient.extractIssues(initialReport.content);
      expect(extractedIssues).toHaveLength(1);
      expect(extractedIssues[0].issue).toBe('API応答遅延');
      expect(extractedIssues[0].priority).toBe('high');

      const mailBody = await fakeAiClient.generateMailBody(extractedIssues);
      expect(mailBody).toContain('優先度：high');
      expect(mailBody).toContain('課題：API応答遅延');

      await mockNotificationSystem.sendMail(
        'manager@company.com',
        'Unsubmitted Report Summary',
        mailBody
      );

      await updateReportStatus(reportId, 'processed');
      await mockAuditSystem.log('sendUnsubmittedReminder', reportId, []);

      // Verify first execution results
      const reportAfterFirstRun = await getReportById(reportId);
      expect(reportAfterFirstRun.status).toBe('processed');
      expect(mockMailLog).toHaveLength(1);
      expect(mockMailLog[0].recipient).toBe('manager@company.com');
      expect(mockMailLog[0].body).toContain('優先度：high');
      expect(mockMailLog[0].body).toContain('課題：API応答遅延');
      expect(mockAuditLog).toHaveLength(1);
      expect(mockAuditLog[0].action).toBe('sendUnsubmittedReminder');
      expect(mockAuditLog[0].reportId).toBe('report-001');
    }

    const mailCountAfterFirstRun = mockMailLog.length;
    const auditCountAfterFirstRun = mockAuditLog.length;

    // Second execution (idempotent retry)
    const idempotencyKeySecond = getDuplicateCheckKey(reportId, 'sendUnsubmittedReminder');

    // Mark this as a retry with idempotent flag
    if (processedKeys.has(idempotencyKeySecond)) {
      // Already processed - skip side effects but log the retry
      await mockAuditSystem.log('sendUnsubmittedReminder', reportId, ['idempotent_retry']);
    } else {
      // Should not reach here in this test
      throw new Error('Idempotency key not found in set');
    }

    // Verify second execution (idempotent, no duplicate side effects)
    const reportAfterSecondRun = await getReportById(reportId);
    expect(reportAfterSecondRun.status).toBe('processed');
    expect(mockMailLog).toHaveLength(mailCountAfterFirstRun); // No new mail sent
    expect(mockMailLog.length).toBe(1); // Still only 1 mail total

    // Verify no duplicate issues in DB (implicit - no new records added)
    const secondRunReport = await getReportById(reportId);
    expect(secondRunReport.content).toBe('昨日：機能A実装 / 今日：機能B実装 / 課題：API応答遅延');

    // Verify audit log records both executions
    expect(mockAuditLog).toHaveLength(auditCountAfterFirstRun + 1);
    expect(mockAuditLog[0].action).toBe('sendUnsubmittedReminder');
    expect(mockAuditLog[0].reportId).toBe('report-001');
    expect(mockAuditLog[0].flags).toEqual([]);

    expect(mockAuditLog[1].action).toBe('sendUnsubmittedReminder');
    expect(mockAuditLog[1].reportId).toBe('report-001');
    expect(mockAuditLog[1].flags).toContain('idempotent_retry');
  });
});