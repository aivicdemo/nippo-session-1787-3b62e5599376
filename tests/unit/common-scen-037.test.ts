import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fetchMock from 'jest-fetch-mock';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

// Mock audit log and database
const mockAuditLog: Array<{
  timestamp: string;
  action: string;
  isDuplicate: boolean;
  details: Record<string, unknown>;
}> = [];

const mockDatabase = {
  unsubmittedNotifications: [
    {
      id: '001',
      member_id: 'member_001',
      sent_at: '2024-01-15T09:00:00Z',
      status: 'sent',
    },
    {
      id: '002',
      member_id: 'member_002',
      sent_at: '2024-01-15T09:00:00Z',
      status: 'sent',
    },
  ],
  issues: [
    {
      id: 'issue_001',
      title: 'Issue 1',
      priority: 'high',
      created_at: '2024-01-15T09:00:00Z',
    },
    {
      id: 'issue_002',
      title: 'Issue 2',
      priority: 'medium',
      created_at: '2024-01-15T09:00:00Z',
    },
    {
      id: 'issue_003',
      title: 'Issue 3',
      priority: 'low',
      created_at: '2024-01-15T09:00:00Z',
    },
  ],
  morningMeetingReports: [
    {
      id: 'report_001',
      generated_at: '2024-01-15T09:00:00Z',
      status: 'completed',
    },
  ],
  executionAuditLog: [] as Array<{
    execution_id: string;
    timestamp: string;
    action: string;
    is_duplicate: boolean;
    details: Record<string, unknown>;
  }>,
};

const mockEmailSentLog: Array<{
  recipient: string;
  subject: string;
  sent_at: string;
}> = [];

describe('sendUnsubmittedReminder - Idempotent Retry Edge Case (SCEN-037)', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    mockAuditLog.length = 0;
    mockEmailSentLog.length = 0;
    mockDatabase.executionAuditLog.length = 0;
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-037
  test('should not duplicate notifications and database writes on idempotent retry with same timestamp', async () => {
    const fixedTimestamp = '2024-01-15T09:00:00Z';
    const executionId = 'exec_001';
    const unsubmittedMembers = [
      { id: 'member_001', name: 'Alice', email: 'alice@example.com' },
      { id: 'member_002', name: 'Bob', email: 'bob@example.com' },
    ];

    // Mock first execution response
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        notificationsSent: 2,
        issuesExtracted: 3,
        reportGenerated: true,
        executionId: executionId,
        timestamp: fixedTimestamp,
      }),
      { status: 200 }
    );

    // First execution
    const firstResult = await sendUnsubmittedReminder({
      unsubmittedMembers: unsubmittedMembers,
      timestamp: fixedTimestamp,
      executionId: executionId,
    });

    expect(firstResult.success).toBe(true);
    expect(firstResult.notificationsSent).toBe(2);
    expect(firstResult.issuesExtracted).toBe(3);
    expect(firstResult.reportGenerated).toBe(true);

    // Verify initial state
    const initialNotificationCount = mockDatabase.unsubmittedNotifications.length;
    const initialIssueCount = mockDatabase.issues.length;
    const initialReportCount = mockDatabase.morningMeetingReports.length;
    const initialEmailLogCount = mockEmailSentLog.length;

    expect(initialNotificationCount).toBe(2);
    expect(initialIssueCount).toBe(3);
    expect(initialReportCount).toBe(1);

    // Simulate first execution side effects
    mockDatabase.executionAuditLog.push({
      execution_id: executionId,
      timestamp: fixedTimestamp,
      action: 'send_unsubmitted_reminder',
      is_duplicate: false,
      details: {
        notificationsSent: 2,
        issuesExtracted: 3,
        reportGenerated: true,
      },
    });

    mockEmailSentLog.push(
      {
        recipient: 'alice@example.com',
        subject: 'Unsubmitted Report Reminder',
        sent_at: fixedTimestamp,
      },
      {
        recipient: 'bob@example.com',
        subject: 'Unsubmitted Report Reminder',
        sent_at: fixedTimestamp,
      }
    );

    // Mock second execution (idempotent retry) - should return success but not duplicate
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        notificationsSent: 0,
        issuesExtracted: 0,
        reportGenerated: false,
        executionId: executionId,
        timestamp: fixedTimestamp,
        isDuplicate: true,
        message: 'Duplicate execution detected and skipped',
      }),
      { status: 200 }
    );

    // Second execution with same parameters
    const secondResult = await sendUnsubmittedReminder({
      unsubmittedMembers: unsubmittedMembers,
      timestamp: fixedTimestamp,
      executionId: executionId,
    });

    expect(secondResult.success).toBe(true);
    expect(secondResult.isDuplicate).toBe(true);
    expect(secondResult.notificationsSent).toBe(0);
    expect(secondResult.issuesExtracted).toBe(0);
    expect(secondResult.reportGenerated).toBe(false);

    // Simulate duplicate detection in audit log
    mockDatabase.executionAuditLog.push({
      execution_id: executionId,
      timestamp: fixedTimestamp,
      action: 'send_unsubmitted_reminder',
      is_duplicate: true,
      details: {
        notificationsSent: 0,
        issuesExtracted: 0,
        reportGenerated: false,
        deduplicationReason: 'Same execution_id and timestamp',
      },
    });

    // Verify no duplicate database writes
    expect(mockDatabase.unsubmittedNotifications.length).toBe(
      initialNotificationCount
    );
    expect(mockDatabase.unsubmittedNotifications.length).toBe(2);

    expect(mockDatabase.issues.length).toBe(initialIssueCount);
    expect(mockDatabase.issues.length).toBe(3);

    expect(mockDatabase.morningMeetingReports.length).toBe(
      initialReportCount
    );
    expect(mockDatabase.morningMeetingReports.length).toBe(1);

    // Verify no new emails were sent
    expect(mockEmailSentLog.length).toBe(2);

    // Verify audit log has both executions with duplicate flag
    expect(mockDatabase.executionAuditLog.length).toBe(2);
    expect(mockDatabase.executionAuditLog[0].is_duplicate).toBe(false);
    expect(mockDatabase.executionAuditLog[1].is_duplicate).toBe(true);

    // Verify duplicate execution is recorded with timestamp and execution_id match
    const duplicateLog = mockDatabase.executionAuditLog[1];
    expect(duplicateLog.execution_id).toBe(executionId);
    expect(duplicateLog.timestamp).toBe(fixedTimestamp);
    expect(duplicateLog.action).toBe('send_unsubmitted_reminder');
    expect(duplicateLog.details.deduplicationReason).toBe(
      'Same execution_id and timestamp'
    );

    // Verify email API was not called second time
    expect(fetchMock.mock.calls.length).toBe(2);
    const secondCallBody = JSON.parse(fetchMock.mock.calls[1][1]?.body as string);
    expect(secondCallBody.isDuplicate).toBe(true);
  });
});