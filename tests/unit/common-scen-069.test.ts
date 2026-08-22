import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  test('SCEN-069: idempotent retry prevents duplicate mail delivery and database writes', async () => {
    // Setup: Initialize test database with aggregated daily report data
    const aggregatedReportId = 'report-20240115-001';
    const aggregatedReportData = {
      reportId: aggregatedReportId,
      submissionDate: '2024-01-15T09:00:00Z',
      keywords: ['システムダウン', 'データ不整合'],
      content: 'System downtime occurred, data inconsistency detected',
      priority: undefined, // Will be set by AI agent
      unsubmittedMembers: ['user-002', 'user-003'],
    };

    // Mock database for first execution
    const mockDbFirstExecution = {
      auditLogRecords: [] as Array<{ operation: string; timestamp: string; recordId: string }>,
      mailSendLogs: [] as Array<{ mailId: string; memberId: string; reportId: string; timestamp: string }>,
      prioritizedIssuesList: [] as Array<{ issueId: string; reportId: string; priority: number; timestamp: string }>,
      query: function(table: string) {
        if (table === 'audit_log') return this.auditLogRecords;
        if (table === 'mail_send_log') return this.mailSendLogs;
        if (table === 'prioritized_issues') return this.prioritizedIssuesList;
        return [];
      },
      insert: function(table: string, record: any) {
        if (table === 'audit_log') {
          this.auditLogRecords.push(record);
        } else if (table === 'mail_send_log') {
          this.mailSendLogs.push(record);
        } else if (table === 'prioritized_issues') {
          this.prioritizedIssuesList.push(record);
        }
      },
    };

    // Mock mail delivery service for first execution
    const mailDeliveryLog: Array<{ to: string; timestamp: string }> = [];
    const mockMailService = {
      send: function(to: string) {
        mailDeliveryLog.push({ to, timestamp: new Date('2024-01-15T09:05:00Z').toISOString() });
        return Promise.resolve({ success: true });
      },
    };

    // First execution: send reminder to unsubmitted members
    const firstExecutionParams = {
      reportId: aggregatedReportId,
      unsubmittedMembers: aggregatedReportData.unsubmittedMembers,
      reportContent: aggregatedReportData.content,
      keywords: aggregatedReportData.keywords,
    };

    const firstResult = await sendUnsubmittedReminder(
      firstExecutionParams,
      mockMailService as any
    );

    // Record database state after first execution
    const firstExecutionMailLogCount = mockDbFirstExecution.query('mail_send_log').length;
    const firstExecutionAuditLogInserts = mockDbFirstExecution.query('audit_log').filter(
      (record: any) => record.operation === 'INSERT'
    ).length;
    const firstExecutionPrioritizedCount = mockDbFirstExecution.query('prioritized_issues').length;

    // Verify first execution results
    expect(firstResult).toBeDefined();
    expect(mailDeliveryLog.length).toBe(2); // One mail per unsubmitted member
    expect(mailDeliveryLog[0].to).toBe('user-002');
    expect(mailDeliveryLog[1].to).toBe('user-003');

    // Store first execution mail delivery count
    const firstExecutionMailDeliveryCount = mailDeliveryLog.length;

    // Setup: Reset mock database for second execution (simulating stateful DB)
    const mockDbSecondExecution = {
      auditLogRecords: [...mockDbFirstExecution.auditLogRecords],
      mailSendLogs: [...mockDbFirstExecution.mailSendLogs],
      prioritizedIssuesList: [...mockDbFirstExecution.prioritizedIssuesList],
      query: function(table: string) {
        if (table === 'audit_log') return this.auditLogRecords;
        if (table === 'mail_send_log') return this.mailSendLogs;
        if (table === 'prioritized_issues') return this.prioritizedIssuesList;
        return [];
      },
      insert: function(table: string, record: any) {
        if (table === 'audit_log') {
          this.auditLogRecords.push(record);
        } else if (table === 'mail_send_log') {
          this.mailSendLogs.push(record);
        } else if (table === 'prioritized_issues') {
          this.prioritizedIssuesList.push(record);
        }
      },
    };

    // Reset mail delivery log for second execution
    const mailDeliveryLogSecondExecution: Array<{ to: string; timestamp: string }> = [];
    const mockMailServiceSecondExecution = {
      send: function(to: string) {
        mailDeliveryLogSecondExecution.push({
          to,
          timestamp: new Date('2024-01-15T09:10:00Z').toISOString(),
        });
        return Promise.resolve({ success: true });
      },
    };

    // Second execution: Retry with identical parameters
    const secondExecutionParams = {
      reportId: aggregatedReportId,
      unsubmittedMembers: aggregatedReportData.unsubmittedMembers,
      reportContent: aggregatedReportData.content,
      keywords: aggregatedReportData.keywords,
    };

    const secondResult = await sendUnsubmittedReminder(
      secondExecutionParams,
      mockMailServiceSecondExecution as any
    );

    // Verify idempotency: No new mail delivery on retry
    expect(mailDeliveryLogSecondExecution.length).toBe(0);

    // Verify database state after second execution: No duplicate records
    const secondExecutionMailLogCount = mockDbSecondExecution.query('mail_send_log').length;
    expect(secondExecutionMailLogCount).toBe(firstExecutionMailLogCount);

    // Verify no new audit log INSERT operations for same report
    const secondExecutionAuditLogInserts = mockDbSecondExecution.query('audit_log').filter(
      (record: any) => record.operation === 'INSERT' && record.recordId === aggregatedReportId
    ).length;
    expect(secondExecutionAuditLogInserts).toBe(firstExecutionAuditLogInserts);

    // Verify prioritized issues list has no duplicate entries
    const secondExecutionPrioritizedCount = mockDbSecondExecution.query('prioritized_issues').filter(
      (record: any) => record.reportId === aggregatedReportId
    ).length;
    expect(secondExecutionPrioritizedCount).toBe(1);

    // Verify second execution result indicates no-op
    expect(secondResult).toBeDefined();
    expect(secondResult.isDuplicate).toBe(true);
    expect(secondResult.mailsSent).toBe(0);
  });
});