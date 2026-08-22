import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';
import type { SubmissionRecord, NotificationPayload, AuditLogEntry } from '../../src/logic/submission-status-management';

describe('submission-status-management', () => {
  let auditLogs: AuditLogEntry[];
  let sentNotifications: NotificationPayload[];

  beforeEach(() => {
    auditLogs = [];
    sentNotifications = [];
  });

  afterEach(() => {
    auditLogs = [];
    sentNotifications = [];
  });

  // SCEN-098
  test('should escalate to human and send notification before confirming side effects when tool integration fails', async () => {
    const now = new Date('2024-01-15T09:00:00Z');
    const submissionDeadline = new Date('2024-01-15T08:00:00Z');

    const extractedIssues = [
      {
        issueId: 'ISSUE-001',
        title: 'Database connection timeout',
        description: 'Connection to production DB failed',
        priority: 'high',
        category: 'infrastructure',
        extractedAt: now.toISOString(),
        status: 'extracted',
      },
      {
        issueId: 'ISSUE-002',
        title: 'API rate limit exceeded',
        description: 'Third-party API rate limit hit',
        priority: 'medium',
        category: 'integration',
        extractedAt: now.toISOString(),
        status: 'extracted',
      },
    ];

    const submissionRecords: SubmissionRecord[] = [
      {
        memberId: 'MEM-001',
        submittedAt: new Date('2024-01-15T07:30:00Z').toISOString(),
        status: 'submitted',
      },
      {
        memberId: 'MEM-002',
        submittedAt: null,
        status: 'not_submitted',
      },
    ];

    const mockAiClient = {
      async action01_extractIssuesFromReports(payload: any) {
        return { issues: extractedIssues, extractionTimestamp: now.toISOString() };
      },

      async action02_validateAndClassify(payload: any) {
        return {
          validated: true,
          classified: extractedIssues.map(issue => ({
            ...issue,
            status: 'classified',
          })),
          validationTimestamp: now.toISOString(),
        };
      },

      async action03_executeToolIntegration(payload: any) {
        const integrationError = {
          status: 'failed',
          errorCode: 'INTEGRATION_FAILED',
          errorMessage: 'Failed to connect to Jira API: Authentication failed',
          failedIssues: extractedIssues.map(issue => issue.issueId),
          integrationTimestamp: now.toISOString(),
        };
        return integrationError;
      },

      async action04_registerToExternalTools(payload: any) {
        throw new Error('Should not be called - integration failed');
      },

      async action05_recordAndNotifyCompletion(payload: any) {
        throw new Error('Should not be called - integration failed');
      },

      async action06_escalateToHuman(payload: any) {
        const notification: NotificationPayload = {
          escalationReason: '既存ツール連携に失敗した',
          issueIds: extractedIssues.map(issue => issue.issueId),
          errorDetail: 'Failed to connect to Jira API: Authentication failed',
          recommendedAction: '人による連携設定の確認が必要',
          notificationTimestamp: now.toISOString(),
          recipientUserId: 'USER-MANAGER-001',
        };
        sentNotifications.push(notification);
        return { escalationNotified: true, notificationId: 'NOTIF-001' };
      },
    };

    const mockAuditLogger = {
      log(entry: AuditLogEntry) {
        auditLogs.push(entry);
      },
    };

    const result = await detectAndNotifyUnsubmitted(
      submissionRecords,
      mockAiClient,
      mockAuditLogger,
      submissionDeadline
    );

    expect(result.escalationTriggered).toBe(true);
    expect(result.escalationReason).toBe('既存ツール連携に失敗した');
    expect(result.unsubmittedMembers).toEqual(['MEM-002']);
    expect(result.processedIssueCount).toBe(2);

    expect(sentNotifications).toHaveLength(1);
    const notification = sentNotifications[0];
    expect(notification.escalationReason).toBe('既存ツール連携に失敗した');
    expect(notification.issueIds).toEqual(['ISSUE-001', 'ISSUE-002']);
    expect(notification.errorDetail).toBe(
      'Failed to connect to Jira API: Authentication failed'
    );
    expect(notification.recommendedAction).toBe('人による連携設定の確認が必要');
    expect(notification.recipientUserId).toBe('USER-MANAGER-001');

    expect(result.toolRegistrationStatus).toBe('pending');

    const escalationLogEntry = auditLogs.find(
      entry => entry.eventType === 'EscalationTriggered'
    );
    expect(escalationLogEntry).toBeDefined();
    expect(escalationLogEntry?.reason).toBe('既存ツール連携に失敗した');
    expect(escalationLogEntry?.recipientUserId).toBe('USER-MANAGER-001');
    expect(escalationLogEntry?.timestamp).toBeDefined();

    expect(result.actionExecutionOrder).toEqual(['action01', 'action02', 'action03', 'action06']);
    expect(result.actionExecutionOrder).not.toContain('action04');
    expect(result.actionExecutionOrder).not.toContain('action05');
  });
});