import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  test('SCEN-174: idempotent retry should not duplicate notifications and database writes', async () => {
    const requestId = 'req-001';
    const periodStart = new Date('2024-01-01T00:00:00Z');
    const periodEnd = new Date('2024-01-31T23:59:59Z');

    const mockUnsubmittedMembers = [
      { memberId: 'mem-001', email: 'alice@example.com', name: 'Alice' },
      { memberId: 'mem-002', email: 'bob@example.com', name: 'Bob' },
      { memberId: 'mem-003', email: 'charlie@example.com', name: 'Charlie' },
    ];

    const mockAggregatedReports = [
      {
        reportId: 'rpt-001',
        memberId: 'mem-004',
        submittedAt: new Date('2024-01-01T09:00:00Z'),
        content: 'Progress: 50%',
      },
      {
        reportId: 'rpt-002',
        memberId: 'mem-005',
        submittedAt: new Date('2024-01-02T09:15:00Z'),
        content: 'Issue: Database connection',
      },
      {
        reportId: 'rpt-003',
        memberId: 'mem-006',
        submittedAt: new Date('2024-01-03T08:45:00Z'),
        content: 'Completed feature X',
      },
      {
        reportId: 'rpt-004',
        memberId: 'mem-007',
        submittedAt: new Date('2024-01-04T10:00:00Z'),
        content: 'Team meeting scheduled',
      },
      {
        reportId: 'rpt-005',
        memberId: 'mem-008',
        submittedAt: new Date('2024-01-05T09:30:00Z'),
        content: 'Code review in progress',
      },
      {
        reportId: 'rpt-006',
        memberId: 'mem-009',
        submittedAt: new Date('2024-01-08T09:00:00Z'),
        content: 'Release candidate prepared',
      },
      {
        reportId: 'rpt-007',
        memberId: 'mem-010',
        submittedAt: new Date('2024-01-09T08:30:00Z'),
        content: 'Performance optimization',
      },
    ];

    const mockExtractedIssues = [
      { issueId: 'iss-001', reportId: 'rpt-001', priority: 'HIGH', category: 'Technical' },
      { issueId: 'iss-002', reportId: 'rpt-002', priority: 'CRITICAL', category: 'Infrastructure' },
      { issueId: 'iss-003', reportId: 'rpt-003', priority: 'LOW', category: 'Feature' },
    ];

    const mockProductivityMetrics = {
      totalReportsSubmitted: 7,
      totalReportsExpected: 10,
      submissionRate: 0.7,
      averageResolutionDays: 3.5,
      criticalIssuesCount: 1,
      highPriorityIssuesCount: 2,
      lowPriorityIssuesCount: 1,
      analysisGeneratedAt: new Date('2024-01-31T15:00:00Z'),
    };

    const mockAnalysisReport = {
      reportId: 'ana-001',
      period: { start: periodStart, end: periodEnd },
      unsubmittedMembers: mockUnsubmittedMembers,
      aggregatedReports: mockAggregatedReports,
      extractedIssues: mockExtractedIssues,
      productivityMetrics: mockProductivityMetrics,
      generatedAt: new Date('2024-01-31T15:05:00Z'),
    };

    const mockEmailService = {
      sentNotifications: [] as Array<{
        recipientEmail: string;
        subject: string;
        sentAt: Date;
      }>,
      sendReminderEmail: jest.fn(async (email: string, name: string) => {
        mockEmailService.sentNotifications.push({
          recipientEmail: email,
          subject: `Reminder: Please submit your report, ${name}`,
          sentAt: new Date('2024-01-31T14:00:00Z'),
        });
        return { success: true, messageId: `msg-${email}-${Date.now()}` };
      }),
    };

    const mockDatabase = {
      notifications: [] as Array<{
        notificationId: string;
        memberId: string;
        type: string;
        createdAt: Date;
      }>,
      analyticsReports: [] as Array<{
        analyticsReportId: string;
        requestId: string;
        createdAt: Date;
      }>,
      auditLogs: [] as Array<{
        auditId: string;
        requestId: string;
        action: string;
        status: string;
        createdAt: Date;
      }>,
      insertNotification: jest.fn(async (notification) => {
        const record = {
          notificationId: `notif-${Date.now()}`,
          memberId: notification.memberId,
          type: 'REMINDER',
          createdAt: new Date('2024-01-31T14:00:00Z'),
        };
        mockDatabase.notifications.push(record);
        return record;
      }),
      insertAnalyticsReport: jest.fn(async (report) => {
        const record = {
          analyticsReportId: `ana-rec-${Date.now()}`,
          requestId: report.requestId,
          createdAt: new Date('2024-01-31T15:05:00Z'),
        };
        mockDatabase.analyticsReports.push(record);
        return record;
      }),
      recordAuditLog: jest.fn(async (log) => {
        const record = {
          auditId: `audit-${Date.now()}`,
          requestId: log.requestId,
          action: log.action,
          status: log.status,
          createdAt: new Date(),
        };
        mockDatabase.auditLogs.push(record);
        return record;
      }),
      getNotificationsByRequestId: jest.fn(async (reqId) => {
        return mockDatabase.notifications.filter(
          (n) => n.createdAt >= new Date('2024-01-31T13:00:00Z')
        );
      }),
      getAnalyticsReportByRequestId: jest.fn(async (reqId) => {
        return mockDatabase.analyticsReports.filter(
          (r) => r.requestId === reqId
        );
      }),
      getAuditLogsByRequestId: jest.fn(async (reqId) => {
        return mockDatabase.auditLogs.filter((a) => a.requestId === reqId);
      }),
      getDuplicateExecutionRecord: jest.fn(async (reqId) => {
        const records = mockDatabase.auditLogs.filter(
          (a) => a.requestId === reqId && a.action === 'SEND_REMINDER'
        );
        return records.length > 0 ? records[0] : null;
      }),
    };

    const mockSlackService = {
      notificationsSent: [] as Array<{
        channelId: string;
        message: string;
        sentAt: Date;
      }>,
      sendReportNotification: jest.fn(async (channelId: string, message: string) => {
        mockSlackService.notificationsSent.push({
          channelId,
          message,
          sentAt: new Date('2024-01-31T15:06:00Z'),
        });
        return { success: true, ts: `ts-${Date.now()}` };
      }),
    };

    // First execution
    const firstExecutionResult = await sendUnsubmittedReminder(
      {
        requestId,
        periodStart,
        periodEnd,
        unsubmittedMembers: mockUnsubmittedMembers,
        aggregatedReports: mockAggregatedReports,
        extractedIssues: mockExtractedIssues,
        productivityMetrics: mockProductivityMetrics,
      },
      {
        emailService: mockEmailService,
        database: mockDatabase,
        slackService: mockSlackService,
      }
    );

    expect(firstExecutionResult.success).toBe(true);
    expect(firstExecutionResult.remindersSent).toBe(3);
    expect(mockEmailService.sentNotifications).toHaveLength(3);
    expect(mockDatabase.notifications).toHaveLength(3);

    const firstExecutionTimestamps = {
      notificationCreatedAt: mockDatabase.notifications[0].createdAt,
    };

    const firstAuditLogs = await mockDatabase.getAuditLogsByRequestId(requestId);
    expect(firstAuditLogs).toHaveLength(1);
    expect(firstAuditLogs[0].status).toBe('SUCCESS');

    // Second execution (idempotent retry)
    const secondExecutionResult = await sendUnsubmittedReminder(
      {
        requestId,
        periodStart,
        periodEnd,
        unsubmittedMembers: mockUnsubmittedMembers,
        aggregatedReports: mockAggregatedReports,
        extractedIssues: mockExtractedIssues,
        productivityMetrics: mockProductivityMetrics,
      },
      {
        emailService: mockEmailService,
        database: mockDatabase,
        slackService: mockSlackService,
      }
    );

    expect(secondExecutionResult.success).toBe(true);
    expect(secondExecutionResult.remindersSent).toBe(0);
    expect(mockDatabase.notifications).toHaveLength(3);
    expect(mockEmailService.sentNotifications).toHaveLength(3);

    const secondAuditLogs = await mockDatabase.getAuditLogsByRequestId(requestId);
    expect(secondAuditLogs).toHaveLength(2);
    expect(secondAuditLogs[1].status).toMatch(/IDEMPOTENT_SKIP|DUPLICATE_DETECTED/);

    const duplicateRecord = await mockDatabase.getDuplicateExecutionRecord(requestId);
    expect(duplicateRecord).not.toBeNull();

    expect(mockSlackService.notificationsSent).toHaveLength(1);

    const finalNotifications = mockDatabase.notifications;
    expect(finalNotifications).toHaveLength(3);
    expect(finalNotifications[0].createdAt).toEqual(firstExecutionTimestamps.notificationCreatedAt);
  });
});